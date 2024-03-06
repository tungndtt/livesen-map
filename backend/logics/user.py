from repos.store.storage import DbCursor
from repos.store.dafs.user import select_user, insert_user, update_user
from libs.hash.hasher import encrypt


def get_user(user_id: int | None = None, email: str | None = None):
    user = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        user = select_user(cursor, user_id, email)
    return user if db_cursor.error is None else None


def add_user(data):
    inserted_user = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        inserted_user = insert_user(cursor, data)
    return inserted_user if db_cursor.error is None else None


def modify_user(user_id: int, data):
    if "password" in data and data["password"]:
        data["password"] = encrypt(data["password"])
    updated_user = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        updated_user = update_user(cursor, user_id, data)
    if db_cursor.error is None and updated_user is not None:
        del updated_user["password"]
        return updated_user
    else:
        return None
