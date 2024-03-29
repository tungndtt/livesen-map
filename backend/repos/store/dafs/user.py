from repos.store.storage import Cursor
from typing import Any


def __parse_record(record: Any) -> dict[str, Any] | None:
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


def __extract_nonempty(data: dict[str, Any]) -> tuple[list[str], list[Any]]:
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


def insert_user(cursor: Cursor, data: dict[str, Any]) -> dict[str, Any] | None:
    if "email" not in data or "password" not in data:
        return None
    cols, vals = __extract_nonempty(data)
    insert_cols = ", ".join(cols)
    inserted_vals = ", ".join(["%s" for _ in range(len(vals))])
    cursor.execute(
        f"""INSERT INTO "user"({insert_cols}) VALUES ({inserted_vals}) RETURNING *""",
        (*vals,)
    )
    return __parse_record(cursor.fetchone())


def update_user(cursor: Cursor, user_id: int, data: dict[str, Any]) -> dict[str, Any] | None:
    if "email" in data:
        del data["email"]
    cols, vals = __extract_nonempty(data)
    update_cols = " = %s, ".join(cols) + " = %s"
    cursor.execute(
        f"""UPDATE "user" SET {update_cols} WHERE id = %s RETURNING *""",
        (*vals, user_id,)
    )
    return __parse_record(cursor.fetchone())


def select_user(
    cursor: Cursor,
    user_id: int | None = None, email: str | None = None
) -> dict[str, Any] | None:
    if user_id:
        cursor.execute(
            """SELECT * FROM "user" where id = %s""", (user_id,)
        )
    elif email:
        cursor.execute(
            """SELECT * FROM "user" where email = %s""", (email,)
        )
    return __parse_record(cursor.fetchone())
