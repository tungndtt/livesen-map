from services.store.storage import DbCursor


def __parse_record(record):
    if record is None:
        return None
    return {
        col: record[i]
        for i, col in enumerate([
            "user_id", "field_id", "period_id",
            "max_allowed_fertilizer", "intercrop",
            "soil_type", "variety",
            "seed_date", "seed_density",
            "first_fertilizer_amount", "second_fertilizer_amount",
            "first_soil_tillage", "second_soil_tillage",
            "first_crop_protection", "second_crop_protection",
            "nitrate", "phosphor", "potassium", "ph",
            "recommended_fertilizer_amount", "yield"
        ])
    }


def upsert_season(user_id, data):
    if "field_id" not in data or "period_id" not in data:
        return None
    cols, vals = [], []
    for col in [
        "max_allowed_fertilizer", "intercrop",
        "soil_type", "variety",
        "seed_date", "seed_density",
        "first_fertilizer_amount", "second_fertilizer_amount",
        "first_soil_tillage", "second_soil_tillage",
        "first_crop_protection", "second_crop_protection",
        "nitrate", "phosphor", "potassium", "ph",
        "recommended_fertilizer_amount", "yield"
    ]:
        if col in data:
            cols.append(col)
            vals.append(data[col])
    insert_cols = ", ".join(cols)
    update_cols = " = %s, ".join(cols)
    upsert_vals = ", ".join(["%s" * len(vals)])
    upserted_season = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            f"""
            INSERT INTO season(user_id, field_id, period_id, {insert_cols})
            VALUES (%s, %s, %s, {upsert_vals})
            ON CONFLICT (field_id, period_id) DO UPDATE
            SET {update_cols}
            RETURNING *
            """,
            (user_id, data["field_id"], data["period_id"], *vals, *vals,)
        )
        upserted_season = __parse_record(cursor.fetchone())
    return upserted_season if db_cursor.error is None else None


def delete_season(user_id, field_id, period_id):
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "DELETE FROM season WHERE user_id = %s, field_id = %s, period_id = %s",
            (user_id, field_id, period_id,)
        )
    return db_cursor.error is None


def list_seasons(user_id, field_id, period_id):
    seasons = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "SELECT * FROM season WHERE user_id = %s, field_id = %s, period_id = %s",
            (user_id, field_id, period_id,)
        )
        seasons = [__parse_record(record) for record in cursor.fetchall()]
    return seasons if db_cursor.error is None else None
