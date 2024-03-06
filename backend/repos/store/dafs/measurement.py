from typing import Any
from repos.store.storage import Cursor


def __parse_record(record: tuple) -> dict[str, Any] | None:
    if record is None:
        return None
    return {
        col: record[i]
        for i, col in enumerate([
            "id", "user_id", "field_id", "season_id",
            "longitude", "latitude",
            "nitrate", "phosphor", "potassium",
            "ndvi", "charge", "stadium", "soil_condition",
            "sample_image",
        ])
    }


def __extract_nonempty(data: dict[str, Any]) -> tuple[list[str], list[Any]]:
    cols, vals = [], []
    for col in [
        "longitude", "latitude",
        "nitrate", "phosphor", "potassium",
        "ndvi", "charge", "stadium", "soil_condition",
        "sample_image"
    ]:
        if col in data and data[col] is not None:
            cols.append(col)
            vals.append(data[col])
    return cols, vals


def insert_measurement(
    cursor: Cursor,
    user_id: int, field_id: int, season_id: str,
    data: dict[str, Any],
) -> dict[str, Any] | None:
    cols, vals = __extract_nonempty(data)
    inserted_measurement = None
    if len(cols) > 0:
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
        inserted_measurement = __parse_record(cursor.fetchone())
    return inserted_measurement


def update_measurement(
    cursor: Cursor,
    user_id: int, measurement_id: int,
    data: dict[str, Any],
) -> dict[str, Any] | None:
    cols, vals = __extract_nonempty(data)
    updated_measurement = None
    if len(cols) > 0:
        update_cols = " = %s, ".join(cols) + " = %s"
        cursor.execute(
            f"UPDATE measurement SET {update_cols} WHERE user_id = %s AND id = %s RETURNING *",
            (*vals, user_id, measurement_id,)
        )
        updated_measurement = __parse_record(cursor.fetchone())
    return updated_measurement


def select_measurement(cursor: Cursor, user_id: int, measurement_id: int) -> dict[str, Any] | None:
    cursor.execute(
        "SELECT * FROM measurement WHERE user_id = %s AND id = %s",
        (user_id, measurement_id,)
    )
    return __parse_record(cursor.fetchone())


def select_measurements(
    cursor: Cursor,
    user_id: int, field_id: int, season_id: str
) -> list[dict[str, Any]] | None:
    cursor.execute(
        "SELECT * FROM measurement WHERE user_id = %s AND field_id = %s AND season_id = %s",
        (user_id, field_id, season_id,)
    )
    return [__parse_record(record) for record in cursor.fetchall()]


def select_sample_images(
    cursor: Cursor,
    user_id: int, field_id: int, season_id: str | None = None
) -> list[str] | None:
    if season_id:
        cursor.execute(
            "SELECT sample_image FROM measurement WHERE user_id = %s AND field_id = %s AND season_id = %s",
            (user_id, field_id, season_id,)
        )
    else:
        cursor.execute(
            "SELECT sample_image FROM measurement WHERE user_id = %s AND field_id = %s",
            (user_id, field_id,)
        )
    return [record[0] for record in cursor.fetchall()]
