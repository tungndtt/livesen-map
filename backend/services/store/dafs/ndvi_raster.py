from services.store.storage import DbCursor


def get_ndvi_raster(user_id: int, field_id: int, season_id: str) -> str | None:
    ndvi_raster = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            SELECT ndvi_raster
            FROM ndvi_raster
            WHERE user_id = %s AND field_id = %s AND season_id = %s
            """,
            (user_id, field_id, season_id,)
        )
        record = cursor.fetchone()
        if record is not None:
            ndvi_raster = record[0]
    return ndvi_raster if db_cursor.error is None else None


def list_ndvi_rasters(user_id: int, field_id: int) -> dict[str, str] | None:
    ndvi_rasters = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            SELECT season_id, ndvi_raster
            FROM ndvi_raster
            WHERE user_id = %s AND field_id = %s
            """,
            (user_id, field_id,)
        )
        records = cursor.fetchall()
        if len(records) > 0:
            ndvi_rasters = {season_id: ndvi_raster
                            for season_id, ndvi_raster in records}
    return ndvi_rasters if db_cursor.error is None else None


def insert_ndvi_raster(user_id: int, field_id: int, season_id: str, ndvi_raster: str) -> bool:
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            INSERT INTO ndvi_raster(user_id, field_id, season_id, ndvi_raster)
            VALUES (%s, %s, %s, %s)
            """,
            (user_id, field_id, season_id, ndvi_raster,)
        )
    return db_cursor.error is None
