from services.store.storage import DbCursor, transaction_decorator
from psycopg2._psycopg import cursor as Cursor
from psycopg2.extras import Json
from typing import Any


def __parse_record(record: tuple) -> dict[str, Any] | None:
    if record is None:
        return None
    return {
        col: record[i]
        for i, col in enumerate([
            "user_id", "field_id", "season_id",
            "maincrop", "intercrop",
            "soil_type", "variety",
            "seed_density", "seed_date",
            "max_allowed_fertilizer",
            "fertilizer_applications",
            "soil_tillage_applications",
            "crop_protection_applications",
            "nitrate", "phosphor", "potassium", "ph", "rks",
            "harvest_weight", "harvest_date",
        ])
    }


def __extract_nonempty(data: dict[str, Any]) -> tuple[list[str], list[Any]]:
    cols, vals = [], []
    for col in [
        "maincrop", "intercrop",
        "soil_type", "variety",
        "seed_density", "seed_date",
        "max_allowed_fertilizer",
        "nitrate", "phosphor", "potassium", "ph", "rks",
        "harvest_weight", "harvest_date",
    ]:
        if col in data and data[col] is not None:
            cols.append(col)
            vals.append(data[col])
    for col in [
        "fertilizer_applications",
        "soil_tillage_applications",
        "crop_protection_applications",
    ]:
        if col in data and data[col] is not None:
            cols.append(col)
            vals.append(Json(data[col]))
    return cols, vals


@transaction_decorator
def update_season(
    user_id: int, field_id: int, season_id: str,
    data: dict[str, Any],
    cursor: Cursor | None = None
) -> dict[str, Any] | None:
    cols, vals = __extract_nonempty(data)
    updated_season = None
    if len(cols) > 0:
        update_cols = " = %s, ".join(cols) + " = %s"
        cursor.execute(
            f"""
            UPDATE season
            SET {update_cols}
            WHERE user_id = %s AND field_id = %s AND season_id = %s
            RETURNING *
            """,
            (*vals, user_id, field_id, season_id,)
        )
        updated_season = __parse_record(cursor.fetchone())
    return updated_season


def insert_season(
    user_id: int, field_id: int, season_id: str,
    data: dict[str, Any]
) -> dict[str, Any] | None:
    cols, vals = __extract_nonempty(data)
    inserted_season = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        if len(cols) > 0:
            insert_cols = ", ".join(cols)
            upsert_vals = ", ".join(["%s" for _ in range(len(vals))])
            insert_cmd = f"""
            INSERT INTO season(user_id, field_id, season_id, {insert_cols})
            VALUES (%s, %s, %s, {upsert_vals})
            RETURNING *
            """
        else:
            insert_cmd = f"""
            INSERT INTO season(user_id, field_id, season_id)
            VALUES (%s, %s, %s)
            RETURNING *
            """
        cursor.execute(insert_cmd,
                       (user_id, field_id, season_id, *vals,))
        inserted_season = __parse_record(cursor.fetchone())
    return inserted_season if db_cursor.error is None else None


def delete_season(user_id: int, field_id: int, season_id: str) -> bool:
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "DELETE FROM season WHERE user_id = %s AND field_id = %s AND season_id = %s",
            (user_id, field_id, season_id,)
        )
    return db_cursor.error is None


def get_season(user_id: int, field_id: int, season_id: str) -> dict[str, Any] | None:
    season = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "SELECT * FROM season WHERE user_id = %s AND field_id = %s AND season_id = %s",
            (user_id, field_id, season_id,)
        )
        season = __parse_record(cursor.fetchone())
    return season if db_cursor.error is None else None


def list_season_ids(user_id: int, field_id: int) -> list[str] | None:
    season_ids = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "SELECT season_id FROM season WHERE user_id = %s AND field_id = %s",
            (user_id, field_id,)
        )
        season_ids = [record[0] for record in cursor.fetchall()]
    return season_ids if db_cursor.error is None else None
