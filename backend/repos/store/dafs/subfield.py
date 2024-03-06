from typing import Any
from json import loads as json_parse
from repos.store.storage import Cursor


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


def __extract_nonempty(data: dict[str, Any]) -> tuple[list[str], list[Any]]:
    cols, vals = [], []
    for col in ["recommended_fertilizer_amount"]:
        if col in data and data[col] is not None:
            cols.append(col)
            vals.append(data[col])
    return cols, vals


def update_subfield(
    cursor: Cursor,
    user_id: int, subfield_id: int,
    data: dict[str, Any]
) -> dict[str, Any] | None:
    cols, vals = __extract_nonempty(data)
    if len(cols) > 0:
        update_cols = " = %s, ".join(cols) + " = %s"
        cursor.execute(
            f"UPDATE subfield SET {update_cols} WHERE user_id = %s AND id = %s",
            (*vals, user_id, subfield_id,)
        )


def insert_subfield(
    cursor: Cursor,
    user_id: int, field_id: int, season_id: str, measurement_id: int,
    region: str, ndvi: float,
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
        UPDATE subfield
        SET area = ST_Area(region::geography) / 10000
        WHERE id = %s
        RETURNING id, field_id, season_id, measurement_id, ST_AsGeoJSON(region), area, ndvi, recommended_fertilizer_amount
        """,
        (subfield_id, )
    )
    return __parse_record(cursor.fetchone())


def select_subfields(
    cursor: Cursor,
    user_id: int, field_id: int, season_id: str
) -> list[dict[str, Any]] | None:
    cursor.execute(
        """
        SELECT id, field_id, season_id, measurement_id, ST_AsGeoJSON(region), area, ndvi, recommended_fertilizer_amount
        FROM subfield
        WHERE user_id = %s AND field_id = %s AND season_id = %s
        """,
        (user_id, field_id, season_id,)
    )
    return [__parse_record(record) for record in cursor.fetchall()]
