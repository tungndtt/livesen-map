import os
from repos.store.storage import DbCursor
from repos.store.dafs.field import select_field
from repos.store.dafs.season import select_season, list_season_ids, insert_season, update_season, delete_season, select_ndvi_rasters
from repos.store.dafs.measurement import select_sample_images
from repos.recommend.recommender import recommend_season_fertilizer
from libs.algo.field_ndvi import get_field_ndvi
from config import NDVI, MEASUREMENT


def get_ndvi_raster(user_id: int, field_id: int, season_id: str):
    updated_season = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        season = select_season(cursor, user_id, field_id, season_id)
        if season is None:
            return None, None
        if season["ndvi_raster"] is not None:
            return season["ndvi_raster"], season["ndvi_date"]
        field = select_field(cursor, user_id, field_id)
        if field is None:
            return None, None
        ndvi_raster, ndvi_date = get_field_ndvi(
            field["coordinates"], season_id)
        if ndvi_raster is None:
            return None, None
        else:
            data = {"ndvi_raster": ndvi_raster, "ndvi_date": ndvi_date}
            updated_season = update_season(
                cursor, user_id, field_id, season_id, data
            )
    if db_cursor.error is None and updated_season is not None:
        return updated_season["ndvi_raster"], updated_season["ndvi_date"]
    else:
        return None, None


def get_season_options(user_id: int, field_id: int):
    season_ids = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        season_ids = list_season_ids(cursor, user_id, field_id)
    return season_ids if db_cursor.error is None else None


def get_season(user_id: int, field_id: int, season_id: str):
    season = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        season = select_season(cursor, user_id, field_id, season_id)
    return season if db_cursor.error is None else None


def add_season(user_id: int, field_id: int, season_id: str, data):
    inserted_season = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        inserted_season = insert_season(
            cursor, user_id, field_id, season_id, data
        )
    return inserted_season if db_cursor.error is None else None


def modify_season(user_id: int, field_id: int, season_id: str, data):
    updated_season = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        updated_season = update_season(
            cursor, user_id, field_id, season_id, data
        )
    return updated_season if db_cursor.error is None else None


def remove_season(user_id: int, field_id: int, season_id: str):
    db_cursor = DbCursor()
    ndvi_rasters, measurement_sample_images = None, None
    with db_cursor as cursor:
        ndvi_rasters = select_ndvi_rasters(
            cursor, user_id, field_id, season_id
        )
        measurement_sample_images = select_sample_images(
            cursor, user_id, field_id, season_id
        )
        delete_season(cursor, user_id, field_id, season_id)
    if db_cursor.error is None:
        try:
            if ndvi_rasters is not None:
                for ndvi_raster in ndvi_rasters:
                    if ndvi_raster is not None:
                        os.remove(os.path.join(NDVI.data_folder, ndvi_raster))
            if measurement_sample_images is not None:
                for measurement_sample_image in measurement_sample_images:
                    if measurement_sample_image is not None:
                        os.remove(
                            os.path.join(MEASUREMENT.data_folder,
                                         measurement_sample_image)
                        )
        except Exception as error:
            print("[Season API]", error)
        return True
    else:
        return False


def get_season_fertilizer_recommendation(user_id: int, field_id: int, season_id: str, fertilizer: str):
    season = get_season(user_id, field_id, season_id)
    if season is not None:
        season["fertilizer_applications"].append(
            {"fertilizer": fertilizer, "amount": -1}
        )
        return recommend_season_fertilizer(season)
    return None
