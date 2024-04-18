from typing import Any
import os
from repos.store.storage import DbCursor
from repos.store.dafs.field import select_field
from repos.store.dafs.season import select_season, list_season_ids, insert_season, update_season, delete_season, select_ndvi_rasters
from repos.recommend.recommender import recommend_season_fertilizer
from repos.ndvi.raster import register_parcel, download_raster
from logics.callback import season_unregistration_callback, measurement_unregistration_callback


def get_ndvi_raster(user_id: int, field_id: int, season_id: str):
    updated_season = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        season = select_season(cursor, user_id, field_id, season_id)
        if season is None:
            return None, None
        if season["ndvi_raster"] is not None:
            return season["ndvi_raster"], season["ndvi_date"]
        parcel_id = season["parcel_id"]
        if parcel_id is None:
            field = select_field(cursor, user_id, field_id)
            if field is None:
                return None, None
            parcel_id = register_parcel(season_id, field["coordinates"])
        if parcel_id is None:
            return None, None
        ndvi_raster, ndvi_date = download_raster(season_id, parcel_id)
        data = {"ndvi_raster": ndvi_raster, "ndvi_date": ndvi_date}
        updated_season = update_season(cursor, user_id, field_id, season_id, data)
    if db_cursor.error is None and updated_season is not None:
        return updated_season["ndvi_raster"], updated_season["ndvi_date"]
    else:
        return None, None


def get_season_options(user_id: int, field_id: int) -> list[str] | None:
    season_ids = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        season_ids = list_season_ids(cursor, user_id, field_id)
    return season_ids if db_cursor.error is None else None


def get_season(user_id: int, field_id: int, season_id: str) -> dict[str, Any] | None:
    season = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        season = select_season(cursor, user_id, field_id, season_id)
    return season if db_cursor.error is None else None


def add_season(user_id: int, field_id: int, season_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    inserted_season = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        field = select_field(cursor, user_id, field_id)
        if field is None:
            return None
        data["parcel_id"] = register_parcel(season_id, field["coordinates"])
        inserted_season = insert_season(
            cursor, user_id, field_id, season_id, data
        )
    return inserted_season if db_cursor.error is None else None


def modify_season(user_id: int, field_id: int, season_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    updated_season = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        updated_season = update_season(
            cursor, user_id, field_id, season_id, data
        )
    return updated_season if db_cursor.error is None else None


def remove_season(user_id: int, field_id: int, season_id: str) -> bool:
    db_cursor = DbCursor()
    with db_cursor as cursor:
        season_callback = season_unregistration_callback(user_id, field_id, season_id)
        measurement_callback = measurement_unregistration_callback(user_id, field_id, season_id)
        delete_season(cursor, user_id, field_id, season_id)
    if db_cursor.error is None:
        season_callback()
        measurement_callback()
        return True
    else:
        return False


def get_season_fertilizer_recommendation(
    user_id: int, field_id: int, season_id: str, fertilizer: str
) -> float | None:
    season = get_season(user_id, field_id, season_id)
    if season is not None:
        season["fertilizer_applications"].append(
            {"fertilizer": fertilizer, "amount": -1}
        )
        return recommend_season_fertilizer(season)
    return None
