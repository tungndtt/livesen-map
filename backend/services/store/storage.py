# initdb -U <username> -A password -E utf8 -W -D <data-folder>
# pg_ctl -D <data-folder> -l <log-file> start/stop
# pg_ctl status -D <data-folder>
import time
import schedule
from threading import Thread, Event
from psycopg2 import pool, sql, connect
from psycopg2._psycopg import cursor as Cursor
from config import STORAGE, APP
from typing import Any


__event = None
__thread = None
_dbpool = None


def __init_connection():
    global _dbpool
    retry = 20
    while retry > 0:
        try:
            __init_database()
            db_params = {
                "dbname": STORAGE.dbname,
                "user": STORAGE.user,
                "password": STORAGE.password,
                "host": STORAGE.host,
                "port": STORAGE.port,
            }
            _dbpool = pool.ThreadedConnectionPool(
                minconn=1, maxconn=64, **db_params
            )
            __init_tables()
            break
        except Exception as error:
            print("[Storage]", error)
        finally:
            retry -= 1
            time.sleep(1)


def __get_connection():
    # Database connection parameters
    db_params = {
        "dbname": "postgres",
        "user": STORAGE.user,
        "password": STORAGE.password,
        "host": STORAGE.host,
        "port": STORAGE.port,
    }
    # Connect to the PostgreSQL server
    retry = 20
    conn = None
    while retry > 0:
        try:
            conn = connect(**db_params)
            break
        except:
            retry -= 1
            time.sleep(1)
    return conn


def __check_connection():
    global _dbpool
    if _dbpool is None:
        __init_connection()
    elif __get_connection() is None:
        __init_connection()


def __run_job():
    __check_connection()
    schedule.every(30).minutes.do(__check_connection)
    while __event.is_set():
        schedule.run_pending()
        time.sleep(4)


def __init_database() -> None:
    conn = __get_connection()
    if conn is None:
        raise Exception("Cannot connect to database")
    # Create a cursor
    cursor: Cursor = conn.cursor()
    conn.autocommit = True
    database_name = STORAGE.dbname
    try:
        # Check if the database already exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", (database_name,))
        if cursor.fetchone() is None:
            # Database does not exist; create it
            dbname = sql.Identifier(database_name)
            user = sql.Identifier(STORAGE.user)
            create_cmd = sql.SQL("CREATE DATABASE {}").format(dbname)
            grant_cmd = sql.SQL(
                "GRANT ALL PRIVILEGES ON DATABASE {} TO {}"
            ).format(dbname, user)
            cursor.execute(create_cmd)
            cursor.execute(grant_cmd)
            print(f"[Storage] '{database_name}' created.")
        else:
            print(f"[Storage] '{database_name}' already exists.")
    except Exception as error:
        print("[Storage]", error)
    finally:
        # Close the cursor and connection
        cursor.close()
        conn.close()


def __init_tables() -> None:
    with DbCursor() as cursor:
        cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis")
        # SQL CREATE TABLE statement
        create_table_user_cmd = """
        CREATE TABLE IF NOT EXISTS "user" (
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
            name text not null,
            region GEOMETRY(POLYGON, 4326) not null,
            area double precision,
            straubing_distance double precision,
            UNIQUE (user_id, name),
            FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
        )
        """
        create_table_season_cmd = """
        CREATE TABLE IF NOT EXISTS season (
            user_id integer not null,
            field_id integer not null,
            season_id text not null,
            maincrop text,
            intercrop text,
            soil_type text,
            variety text,
            seed_density double precision,
            seed_date timestamp,
            max_allowed_fertilizer double precision,
            fertilizer_applications json not null default '[]',
            soil_tillage_applications json not null default '[]',
            crop_protection_applications json not null default '[]',
            nitrate double precision,
            phosphor double precision,
            potassium double precision,
            ph double precision,
            rks double precision,
            harvest_weight double precision,
            harvest_date timestamp,
            PRIMARY KEY (field_id, season_id),
            FOREIGN KEY (user_id) REFERENCES "user"(id),
            FOREIGN KEY (field_id) REFERENCES field(id) ON DELETE CASCADE
        )
        """
        create_table_ndvi_raster_cmd = """
        CREATE TABLE IF NOT EXISTS ndvi_raster (
            user_id integer not null,
            field_id integer not null,
            season_id text not null,
            ndvi_raster text not null,
            source_date date not null,
            PRIMARY KEY (field_id, season_id),
            FOREIGN KEY (user_id) REFERENCES "user"(id),
            FOREIGN KEY (field_id) REFERENCES field(id) ON DELETE CASCADE,
            FOREIGN KEY (field_id, season_id) REFERENCES season(field_id, season_id) ON DELETE CASCADE
        )
        """
        create_table_measurement_cmd = """
        CREATE TABLE IF NOT EXISTS measurement (
            id serial PRIMARY KEY,
            user_id integer not null,
            field_id integer not null,
            season_id text not null,
            longitude double precision,
            latitude double precision,
            nitrate double precision,
            phosphor double precision,
            potassium double precision,
            ndvi double precision,
            FOREIGN KEY (user_id) REFERENCES "user"(id),
            FOREIGN KEY (field_id, season_id) REFERENCES season(field_id, season_id) ON DELETE CASCADE,
            FOREIGN KEY (field_id) REFERENCES field(id) ON DELETE CASCADE
        )
        """
        create_table_subfield_cmd = """
        CREATE TABLE IF NOT EXISTS subfield (
            id serial PRIMARY KEY,
            user_id integer not null,
            field_id integer not null,
            season_id text not null,
            measurement_id integer not null,
            area double precision,
            region GEOMETRY(POLYGON, 4326) not null,
            ndvi double precision,
            recommended_fertilizer_amount double precision,
            FOREIGN KEY (user_id) REFERENCES "user"(id),
            FOREIGN KEY (measurement_id) REFERENCES measurement(id) ON DELETE CASCADE
        )
        """
        for cmd in [
            create_table_user_cmd,
            create_table_field_cmd,
            create_table_season_cmd,
            create_table_ndvi_raster_cmd,
            create_table_measurement_cmd,
            create_table_subfield_cmd,
        ]:
            cursor.execute(cmd)
        if APP.is_testing:
            cursor.execute(
                """
                INSERT INTO "user"(id, name, address, company_name, company_size, email, password)
                VALUES (1, 'test', 'test address', 'test company', 1, 'user@test.com', 'test_password')
                ON CONFLICT (id) DO NOTHING
                """
            )


def init() -> None:
    global __event, __thread
    if __thread is None:
        __event = Event()
        __event.set()
        __thread = Thread(target=__run_job)
        __thread.start()


def term():
    global _dbpool, __thread, __event
    if _dbpool is not None:
        _dbpool.closeall()
    if __thread is not None:
        __event.clear()
        __thread.join()


class DbCursor:
    def __init__(self) -> None:
        self.error = None
        self.__conn = None
        self.__cursor = None

    def __enter__(self) -> Cursor:
        global _dbpool
        try:
            self.__conn = _dbpool.getconn()
            self.__cursor = self.__conn.cursor()
            return self.__cursor
        except Exception as error:
            self.error = error

    def __exit__(self, error_type, error, _) -> None:
        global _dbpool
        try:
            if error_type is not None:
                self.error = error
            else:
                self.__conn.commit()
        except Exception as error:
            print("[Storage]", error)
            self.error = error
            self.__conn.rollback()
        finally:
            if self.__cursor is not None:
                self.__cursor.close()
                _dbpool.putconn(self.__conn)
        return True


def transaction_decorator(f):
    def decorator(*args, **kwargs) -> Any | None:
        if "cursor" in kwargs and kwargs["cursor"] is not None:
            return f(*args, **kwargs)
        else:
            db_cursor = DbCursor()
            with db_cursor as cursor:
                kwargs["cursor"] = cursor
                return f(*args, **kwargs)
    return decorator
