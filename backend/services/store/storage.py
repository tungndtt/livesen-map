# initdb -U <username> -A password -E utf8 -W -D <data-folder>
# pg_ctl -D <data-folder> -l <log-file> start/stop
# pg_ctl status -D <data-folder>
import psycopg2
from psycopg2 import pool, sql
from config import STORAGE, APP


__dbpool = None


def __init_database():
    # Database connection parameters
    db_params = {
        "dbname": "postgres",
        "user": STORAGE.user,
        "password": STORAGE.password,
        "host": STORAGE.host,
        "port": STORAGE.port,
    }
    # Connect to the PostgreSQL server
    conn = psycopg2.connect(**db_params)
    # Create a cursor
    cursor = conn.cursor()
    conn.autocommit = True
    database_name = STORAGE.dbname
    try:
        # Check if the database already exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", (database_name,))
        if cursor.fetchone() is None:
            # Database does not exist; create it
            dbname = sql.Identifier(database_name)
            user = sql.Identifier(db_params["user"])
            create_cmd = sql.SQL("CREATE DATABASE {}").format(dbname)
            grant_cmd = sql.SQL(
                "GRANT ALL PRIVILEGES ON DATABASE {} TO {}"
            ).format(dbname, user)
            cursor.execute(create_cmd)
            cursor.execute(grant_cmd)
            print(f"Database '{database_name}' created.")
        else:
            print(f"Database '{database_name}' already exists.")
    except Exception as error:
        print("[Error]", error)
    finally:
        # Close the cursor and connection
        cursor.close()
        conn.close()


def __init_tables():
    with DbCursor() as cursor:
        cursor.execute(
            "SELECT * FROM pg_extension WHERE extname = %s", ("postgis",))
        if cursor.fetchone() is None:
            cursor.execute("CREATE EXTENSION postgis")
        # SQL CREATE TABLE statement
        create_table_user_cmd = """
        CREATE TABLE IF NOT EXISTS 'user' (
            id serial PRIMARY KEY,
            name text,
            address text,
            company_name text,
            company_size integer,
            email text not null unique,
            password text not null
        )
        """
        create_table_field_cmd = """
        CREATE TABLE IF NOT EXISTS field (
            id serial PRIMARY KEY,
            user_id integer not null,
            name text,
            region GEOMETRY(POLYGON, 4326) not null,
            area double precision,
            straubing_distance double precision,
            ndvi_rasters text[] not null default '{}',
            FOREIGN KEY (user_id) REFERENCES 'user'(id)
        )
        """
        create_table_season_cmd = """
        CREATE TABLE IF NOT EXISTS season (
            user_id integer not null,
            field_id integer not null,
            period_id text not null,
            max_allowed_fertilizer double precision,
            intercrop boolean,
            soil_type text,
            variety text,
            seed_date timestamp with time zone,
            seed_density double precision,
            first_fertilizer_amount double precision,
            second_fertilizer_amount double precision,
            first_soil_tillage text,
            second_soil_tillage text,
            first_crop_protection text,
            second_crop_protection text,
            nitrate double precision,
            phosphor double precision,
            potassium double precision,
            ph double precision,
            recommended_fertilizer_amount double precision default -1.0,
            yield double precision default -1.0,
            PRIMARY KEY (field_id, period_id),
            FOREIGN KEY (user_id) REFERENCES 'user'(id),
            FOREIGN KEY (field_id) REFERENCES field(id)
        )
        """
        create_table_subfield_cmd = """
        CREATE TABLE IF NOT EXISTS subfield (
            id serial PRIMARY KEY,
            user_id integer not null,
            field_id integer not null,
            period_id text not null,
            area double precision,
            region GEOMETRY(POLYGON, 4326) not null,
            recommended_fertilizer_amount double precision default -1.0,
            FOREIGN KEY (user_id) REFERENCES 'user'(id),
            FOREIGN KEY (field_id, period_id) REFERENCES season(field_id, period_id)
        )
        """
        create_table_measurement_cmd = """
        CREATE TABLE IF NOT EXISTS measurement (
            id serial PRIMARY KEY,
            user_id integer not null,
            field_id integer not null,
            period_id text not null,
            subfield_id integer not null,
            longitude double precision,
            latitude double precision,
            nitrate_measurement double precision,
            phosphor_measurement double precision,
            potassium_measurement double precision,
            ndvi_value double precision,
            FOREIGN KEY (user_id) REFERENCES 'user'(id),
            FOREIGN KEY (field_id, period_id) REFERENCES season(field_id, period_id),
            FOREIGN KEY (subfield_id) REFERENCES subfield(id),
        )
        """
        for cmd in [
            create_table_user_cmd,
            create_table_field_cmd,
            create_table_season_cmd,
            create_table_subfield_cmd,
            create_table_measurement_cmd
        ]:
            cursor.execute(cmd)
        if APP.dev_mode:
            cursor.execute(
                """
                INSERT INTO 'user'(id, name, address, company_name, company_size, email, password)
                VALUES (1, 'test', 'test address', 'test company', 1, 'user@test.com', 'test_password')
                ON CONFLICT (id) DO NOTHING
                """
            )


def init():
    global __dbpool
    __init_database()
    db_params = {
        "dbname": STORAGE.dbname,
        "user": STORAGE.user,
        "password": STORAGE.password,
        "host": STORAGE.host,
        "port": STORAGE.port,
    }
    __dbpool = pool.ThreadedConnectionPool(minconn=1, maxconn=64, **db_params)
    __init_tables()


class DbCursor:
    def __init__(self):
        self.error = None

    def __enter__(self):
        global __dbpool
        self.__conn = __dbpool.getconn()
        self.__cursor = self.__conn.cursor()
        return self.__cursor

    def __exit__(self, *args):
        global __dbpool
        try:
            self.__conn.commit()
        except Exception as error:
            self.__conn.rollback()
            print("[Storage]", error)
            self.error = error
        finally:
            self.__cursor.close()
            __dbpool.putconn(self.__conn)
