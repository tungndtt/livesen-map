from typing import Any
from psycopg2.extras import Json
from repos.store.storage import Cursor


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
            "harvest_date", "harvest_weight",
            "falling_number", "moisture", "protein_content",
            "parcel_id", "ndvi_raster", "ndvi_date",
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
        "harvest_date", "harvest_weight",
        "falling_number", "moisture", "protein_content",
        "parcel_id", "ndvi_raster", "ndvi_date",
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


def update_season(
    cursor: Cursor,
    user_id: int, field_id: int, season_id: str,
    data: dict[str, Any]
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
    cursor: Cursor,
    user_id: int, field_id: int, season_id: str,
    data: dict[str, Any]
) -> dict[str, Any] | None:
    cols, vals = __extract_nonempty(data)
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
    return __parse_record(cursor.fetchone())


def delete_season(cursor: Cursor, user_id: int, field_id: int, season_id: str) -> None:
    cursor.execute(
        """
        DELETE FROM season
        WHERE user_id = %s AND field_id = %s AND season_id = %s
        RETURNING ndvi_raster
        """,
        (user_id, field_id, season_id,)
    )


def select_season(cursor: Cursor, user_id: int, field_id: int, season_id: str) -> dict[str, Any] | None:
    cursor.execute(
        "SELECT * FROM season WHERE user_id = %s AND field_id = %s AND season_id = %s",
        (user_id, field_id, season_id,)
    )
    return __parse_record(cursor.fetchone())


def list_season_ids(cursor: Cursor, user_id: int, field_id: int) -> list[str]:
    cursor.execute(
        "SELECT season_id FROM season WHERE user_id = %s AND field_id = %s",
        (user_id, field_id,)
    )
    return [record[0] for record in cursor.fetchall()]


def select_ndvi_rasters(
    cursor: Cursor,
    user_id: int, field_id: int, season_id: str | None = None
) -> list[tuple[str, str]]:
    if season_id is None:
        cursor.execute(
            "SELECT ndvi_raster, parcel_id FROM season WHERE user_id = %s AND field_id = %s",
            (user_id, field_id,)
        )
    else:
        cursor.execute(
            "SELECT ndvi_raster, parcel_id FROM season WHERE user_id = %s AND field_id = %s AND season_id = %s",
            (user_id, field_id, season_id,)
        )
    return cursor.fetchall()