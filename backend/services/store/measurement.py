from services.store.storage import DbCursor
from psycopg2._psycopg import cursor as Cursor
from typing import Any


def __parse_record(record: tuple) -> dict[str, Any] | None:
    if record is None:
        return None
    return {
        col: record[i]
        for i, col in enumerate([
            "id", "user_id", "field_id", "season_id",
            "longitude", "latitude",
            "nitrate", "phosphor", "potassium",
            "ndvi"
        ])
    }


def __extract_nonempty(data: dict[str, Any]) -> tuple[list[str], list[Any]]:
    cols, vals = [], []
    for col in [
        "longitude", "latitude",
        "nitrate", "phosphor", "potassium",
        "ndvi"
    ]:
        if col in data and data[col] is not None:
            cols.append(col)
            vals.append(data[col])
    return cols, vals


def insert_measurement(
    cursor: Cursor,
    user_id: int, field_id: int, season_id: str,
    data: dict[str, Any]
) -> dict[str, Any] | None:
    cols, vals = __extract_nonempty(data)
    insert_cols = ", ".join(cols)
    inserted_vals = ", ".join(["%s" for _ in range(len(vals))])
    cursor.execute(
        f"""
        INSERT INTO measurement(user_id, field_id, season_id, {insert_cols})
        VALUES (%s, %s, %s, {inserted_vals})
        RETURNING *
        """,
        (user_id, field_id, season_id, *vals,)
    )
    return __parse_record(cursor.fetchone())


def update_measurement(user_id: int, measurement_id: int, data: dict[str, Any]) -> dict[str, Any] | None:
    cols, vals = __extract_nonempty(data)
    update_cols = " = %s, ".join(cols) + " = %s"
    updated_measurement = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            f"UPDATE measurement SET {update_cols} WHERE user_id = %s AND id = %s RETURNING *",
            (*vals, user_id, measurement_id,)
        )
        updated_measurement = __parse_record(cursor.fetchone())
    return updated_measurement if db_cursor.error is None else None


def list_measurements(user_id: int, field_id: int, season_id: str) -> list[dict[str, Any]] | None:
    measurements = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "SELECT * FROM measurement WHERE user_id = %s AND field_id = %s AND season_id = %s",
            (user_id, field_id, season_id,)
        )
        measurements = [__parse_record(record) for record in cursor.fetchall()]
    return measurements if db_cursor.error is None else None
