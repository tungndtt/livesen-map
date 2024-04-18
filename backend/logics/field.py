from typing import Any
from shapely.geometry import Polygon
from repos.store.storage import DbCursor
from repos.store.dafs.field import select_field, insert_field, delete_field, select_fields_ids
from logics.callback import season_unregistration_callback, measurement_unregistration_callback


def get_field_options(user_id: int) -> list[dict[str, Any]] | None:
    field_ids = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        field_ids = select_fields_ids(cursor, user_id)
    return field_ids if db_cursor.error is None else None


def get_field(user_id: int, field_id: int) -> dict[str, Any] | None:
    field = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        field = select_field(cursor, user_id, field_id)
    return field if db_cursor.error is None else None


def add_field(
    user_id: int, name: str, coordinates: list[list[float]]
) -> dict[str, Any] | None:
    shell = coordinates[0]
    holes = coordinates[1:]
    region = Polygon(shell, holes).__str__()
    inserted_field = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        inserted_field = insert_field(cursor, user_id, name, region)
    return inserted_field if db_cursor.error is None else None


def remove_field(user_id: int, field_id: int) -> bool:
    db_cursor = DbCursor()
    with db_cursor as cursor:
        season_callback = season_unregistration_callback(user_id, field_id)
        measurement_callback = measurement_unregistration_callback(user_id, field_id)
        delete_field(cursor, user_id, field_id)
    if db_cursor.error is None:
        season_callback()
        measurement_callback()
        return True
    else:
        return False
