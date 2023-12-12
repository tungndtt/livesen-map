from services.store.storage import DbCursor


def __parse_record(record):
    if record is None:
        return None
    return {
        col: record[i]
        for i, col in enumerate([
            "id", "user_id", "field_id", "period_id", "subfield_id",
            "longitude", "latitude",
            "nitrate_measurement", "phosphor_measurement", "potassium_measurement",
            "ndvi_value"
        ])
    }


def __extract_nonempty(data):
    cols, vals = [], []
    for col in [
        "longitude", "latitude",
        "nitrate_measurement", "phosphor_measurement", "potassium_measurement",
        "ndvi_value"
    ]:
        if col in data:
            cols.append(col)
            vals.append(data[col])
    return cols, vals


def insert_measurement(cursor, user_id, field_id, period_id, subfield_id, data):
    cols, vals = __extract_nonempty(data)
    insert_cols = ", ".join(cols)
    inserted_vals = ", ".join(["%s" for _ in range(len(vals))])
    cursor.execute(
        f"""
        INSERT INTO measurement(user_id, field_id, period_id, subfield_id, {insert_cols})
        VALUES (%s, %s, %s, %s, {inserted_vals})
        RETURNING *
        """,
        (user_id, field_id, period_id, subfield_id, *vals,)
    )
    return __parse_record(cursor.fetchone())


def update_measurement(user_id, measurement_id, data):
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


def list_measurements(user_id, field_id, period_id):
    measurements = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "SELECT * FROM measurement WHERE user_id = %s AND field_id = %s AND period_id = %s",
            (user_id, field_id, period_id,)
        )
        measurements = [__parse_record(record) for record in cursor.fetchall()]
    return measurements if db_cursor.error is None else None
