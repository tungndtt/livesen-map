from services.store.storage import DbCursor
from psycopg2._psycopg import cursor as Cursor
from psycopg2.extras import Json
from json import loads as json_parse
from typing import Any


def __parse_record(record: tuple) -> dict[str, Any] | None:
    if record is None:
        return None
    id, user_id, name, geojson, straubing_distance, area, ndvi_rasters = record
    return {
        "id": id,
        "user_id": user_id,
        "name": name,
        "coordinates": json_parse(geojson)["coordinates"],
        "straubing_distance": straubing_distance,
        "area": area,
        "ndvi_rasters": ndvi_rasters
    }


def get_field(user_id: int, field_id: int) -> dict[str, Any] | None:
    field = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            SELECT id, user_id, name, ST_AsGeoJSON(region), straubing_distance, area, ndvi_rasters
            FROM field
            WHERE id = %s AND user_id = %s
            """, (field_id, user_id,))
        field = __parse_record(cursor.fetchone())
    return field if db_cursor.error is None else None


def insert_field(user_id: int, name: str, region: str) -> dict[str, Any] | None:
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
            ),
            area = ST_Area(region)
            WHERE id = %s
            RETURNING id, user_id, name, ST_AsGeoJSON(region), straubing_distance, area, ndvi_rasters
            """,
            (field_id, straubing_position, field_id,)
        )
        inserted_field = __parse_record(cursor.fetchone())
    return inserted_field if db_cursor.error is None else None


def delete_field(field_id: int) -> dict[str, str] | None:
    deleted_ndvi_rasters = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "DELETE FROM field where id = %s RETURNING ndvi_rasters",
            (field_id,)
        )
        record = cursor.fetchone()
        deleted_ndvi_rasters = None if record is None else record[0]
    return deleted_ndvi_rasters if db_cursor.error is None else None


def list_fields_info(user_id: int) -> list[dict[str, Any]] | None:
    field_ids = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            SELECT id, name FROM field WHERE user_id = %s
            """,
            (user_id,)
        )
        field_ids = [{"id": id, "name": name}
                     for id, name in cursor.fetchall()]
    return field_ids if db_cursor.error is None else None


def insert_field_ndvi_raster(field_id: int, season_id: str, ndvi_raster: str) -> bool:
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "SELECT ndvi_rasters FROM field WHERE id = %s", (field_id,))
        ndvi_rasters = cursor.fetchone()[0]
        ndvi_rasters[season_id] = ndvi_raster
        cursor.execute(
            "UPDATE field SET ndvi_rasters = %s WHERE id = %s",
            (Json(ndvi_rasters), field_id,)
        )
    return db_cursor.error is None


def delete_field_ndvi_raster(field_id: int, season_id: str, cursor: Cursor | None = None) -> str | None:
    deleted_ndvi_raster = None
    cursor.execute("SELECT ndvi_rasters FROM field WHERE id = %s", (field_id,))
    ndvi_rasters = cursor.fetchone()[0]
    if season_id in ndvi_rasters:
        deleted_ndvi_raster = ndvi_rasters[season_id]
        del ndvi_rasters[season_id]
        cursor.execute(
            "UPDATE field SET ndvi_rasters = %s WHERE id = %s",
            (Json(ndvi_rasters), field_id,)
        )
    return deleted_ndvi_raster
