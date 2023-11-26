from services.store.storage import DbCursor


def __parse_record(record):
    if record is None:
        return None
    id, user_id, name, geojson, straubing_distance, area, ndvi_rasters = record
    return {
        "id": id,
        "user_id": user_id,
        "name": name,
        "coordinates": geojson["coordinates"],
        "straubing_distance": straubing_distance,
        "area": area,
        "ndvi_rasters": ndvi_rasters
    }


def get_field(user_id, field_id):
    field = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            SELECT id, user_id, name, ST_AsGeoJSON(region), straubing_distance, area, ndvi_rasters
            FROM field
            WHERE id = %s, user_id = %s
            """, (field_id, user_id,))
        field = __parse_record(cursor.fetchone())
    return field if db_cursor.error is None else None


def insert_field(user_id, name, region):
    inserted_field = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            INSERT INTO field(user_id, name, region)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (user_id, name, region,)
        )
        field_id = cursor.fetchone()[0]
        straubing_position = "POINT(12.5828575 48.8846284)"
        cursor.execute(
            """
            UPDATE field
            SET straubing_distance = ST_Distance(
                (SELECT region FROM field WHERE id = %s),
                ST_GeomFromText(%s, 4326)
            )
            AND area = ST_Area(region)
            WHERE id = %s
            RETURNING id, user_id, name, ST_AsGeoJSON(region), straubing_distance, area, ndvi_rasters
            """,
            (field_id, straubing_position, field_id,)
        )
        inserted_field = __parse_record(cursor.fetchone())
    return inserted_field if db_cursor.error is None else None


def delete_field(field_id):
    deleted_field_ndvi_rasters = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "DELETE FROM field where id = %s RETURNING ndvi_rasters",
            (field_id,)
        )
        deleted_field_ndvi_rasters = cursor.fetchone()[0]
    return deleted_field_ndvi_rasters if db_cursor.error is None else None


def list_fields(user_id):
    fields = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            SELECT id, user_id, name, ST_AsGeoJSON(region), straubing_distance, area, ndvi_rasters
            FROM field
            WHERE user_id = %s
            """,
            (user_id,)
        )
        fields = [__parse_record(record) for record in cursor.fetchall()]
    return fields if db_cursor.error is None else None


def insert_field_ndvi_raster(field_id, ndvi_raster):
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "SELECT ndvi_rasters FROM field WHERE id = %s", (field_id,))
        raster_data_list = cursor.fetchone()[0]
        raster_data_list.append(ndvi_raster)
        cursor.execute(
            "UPDATE roi SET ndvi_rasters = %s WHERE id = %s",
            (raster_data_list, field_id,)
        )
    return db_cursor.error is None
