from services.store.storage import DbCursor
from json import loads as json_parse
from typing import Any


def __parse_record(record: tuple) -> dict[str, Any] | None:
    if record is None:
        return None
    id, user_id, name, geojson, straubing_distance, area = record
    return {
        "id": id,
        "user_id": user_id,
        "name": name,
        "coordinates": json_parse(geojson)["coordinates"],
        "straubing_distance": straubing_distance,
        "area": area
    }


def get_field(user_id: int, field_id: int) -> dict[str, Any] | None:
    field = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            SELECT id, user_id, name, ST_AsGeoJSON(region), straubing_distance, area
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
                ST_GeomFromText(%s, 4326)::geography
            ) / 1000,
            area = ST_Area(region::geography) / 10000
            WHERE id = %s
            RETURNING id, user_id, name, ST_AsGeoJSON(region), straubing_distance, area
            """,
            (field_id, straubing_position, field_id,)
        )
        inserted_field = __parse_record(cursor.fetchone())
    return inserted_field if db_cursor.error is None else None


def delete_field(user_id: int, field_id: int) -> bool:
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute("DELETE FROM field where user_id = %s AND id = %s",
                       (user_id, field_id,))
    return db_cursor.error is None


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
