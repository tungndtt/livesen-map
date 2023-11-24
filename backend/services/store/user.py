from services.store.storage import DbCursor


def __parse_record(record):
    if record is None:
        return None
    return {
        col: record[i]
        for i, col in enumerate([
            "id",
            "name", "address",
            "company_name", "company_size",
            "email", "password"
        ])
    }


def __extract_nonempty(data):
    cols, vals = [], []
    for col in [
        "name", "address",
        "company_name", "company_size",
        "email", "password"
    ]:
        if col in data:
            cols.append(col)
            vals.append(data[col])
    return cols, vals


def insert_user(data):
    if "email" not in data or "password" not in data:
        return None
    cols, vals = __extract_nonempty(data)
    insert_cols = ", ".join(cols)
    inserted_vals = ", ".join(["%s" * len(vals)])
    inserted_measurement = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            f"INSERT INTO 'user'({insert_cols}) VALUES ({inserted_vals}) RETURNING *",
            (*vals,)
        )
        inserted_measurement = __parse_record(cursor.fetchone())
    return inserted_measurement if db_cursor.error is None else None


def update_measurement(user_id, data):
    if "email" in data:
        return None
    cols, vals = __extract_nonempty(data)
    update_cols = " = %s, ".join(cols)
    updated_measurement = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            f"UPDATE 'user' SET {update_cols} WHERE id = %s RETURNING *",
            (*vals, user_id,)
        )
        updated_measurement = __parse_record(cursor.fetchone())
    return updated_measurement if db_cursor.error is None else None


def get_user(email):
    user = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute("SELECT * FROM 'user' where email = %s", (email,))
        user = __parse_record(cursor.fetchone())
    return user if db_cursor.error is None else None
