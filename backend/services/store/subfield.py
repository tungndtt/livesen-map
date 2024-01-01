from services.store.storage import DbCursor, transaction_decorator
from json import loads as json_parse
from psycopg2._psycopg import cursor as Cursor
from typing import Any


def __parse_record(record: tuple) -> dict[str, Any] | None:
    if record is None:
        return None
    id, field_id, season_id, measurement_id, geojson, area, ndvi, recommended_fertilizer_amount = record
    return {
        "id": id,
        "field_id": field_id,
        "season_id": season_id,
        "measurement_id": measurement_id,
        "coordinates": json_parse(geojson)["coordinates"],
        "area": area,
        "ndvi": ndvi,
        "recommended_fertilizer_amount": recommended_fertilizer_amount
    }


@transaction_decorator
def update_subfield_recommended_fertilizer_amount(
    subfield_id: int,
    recommended_fertilizer_amount: float,
    cursor: Cursor | None
) -> None:
    cursor.execute(
        "UPDATE subfield SET recommended_fertilizer_amount = %s WHERE id = %s",
        (recommended_fertilizer_amount, subfield_id,)
    )


@transaction_decorator
def insert_subfield(
    user_id: int, field_id: int, season_id: str, measurement_id: int,
    region: str, ndvi: float,
    cursor: Cursor | None = None
) -> dict[str, Any] | None:
    cursor.execute(
        """
        INSERT INTO subfield(user_id, field_id, season_id, measurement_id, region, ndvi)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (user_id, field_id, season_id, measurement_id, region, ndvi,)
    )
    subfield_id = cursor.fetchone()[0]
    cursor.execute(
        """
        UPDATE subfield SET area = ST_Area(region) WHERE id = %s
        RETURNING id, field_id, season_id, measurement_id, ST_AsGeoJSON(region), area, ndvi, recommended_fertilizer_amount
        """,
        (subfield_id, )
    )
    return __parse_record(cursor.fetchone())


def list_subfields(user_id: int, field_id: int, season_id: str) -> list[dict[str, Any]] | None:
    subfields = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            SELECT id, field_id, season_id, measurement_id, ST_AsGeoJSON(region), area, ndvi, recommended_fertilizer_amount
            FROM subfield
            WHERE user_id = %s AND field_id = %s AND season_id = %s
            """,
            (user_id, field_id, season_id,)
        )
        subfields = [__parse_record(record) for record in cursor.fetchall()]
    return subfields if db_cursor.error is None else None
