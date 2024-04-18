from typing import Any
import os
import uuid
from repos.store.storage import DbCursor
from repos.store.dafs.field import select_field
from repos.store.dafs.season import select_season
from repos.store.dafs.measurement import select_measurements, select_measurement, insert_measurement, update_measurement
from repos.store.dafs.subfield import select_subfields, insert_subfield, update_subfield
from repos.recommend.recommender import recommend_subfield_fertilizer
from logics.season import get_ndvi_raster
from libs.algo.subfield_split import get_subfields_pixel_based_split
from libs.algo.measurement_position import find_measurement_position, get_measurement_position_ndvi
from libs.timeout.function_timeout import timeout_function
from config import MEASUREMENT


def get_sample_image(user_id: int, measurement_id: int) -> str | None:
    measurement = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        measurement = select_measurement(cursor, user_id, measurement_id)
    if db_cursor.error is None and measurement is not None:
        return measurement["sample_image"]
    else:
        return None


def get_measurements(
    user_id: int, field_id: int, season_id: str
) -> list[dict[str, Any]] | None:
    measurements = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        measurements = select_measurements(
            cursor, user_id, field_id, season_id
        )
    return measurements if db_cursor.error is None else None


def get_subfields(
    user_id: int, field_id: int, season_id: str
) -> list[dict[str, Any]] | None:
    subfields = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        subfields = select_subfields(cursor, user_id, field_id, season_id)
    return subfields if db_cursor.error is None else None


def get_measurement_positions(
    user_id: int, field_id: int, season_id: str
) -> tuple[list, list] | tuple[None, None]:
    ndvi_raster, _ = get_ndvi_raster(user_id, field_id, season_id)
    if ndvi_raster is None:
        return None, None
    db_cursor = DbCursor()
    inserted_measurements, inserted_subfields = [], []
    with db_cursor as cursor:
        field = select_field(cursor, user_id, field_id)
        if field is None:
            return None, None
        subfield_groups = timeout_function(
            20, get_subfields_pixel_based_split, ndvi_raster, field["coordinates"]
        )
        if subfield_groups is None:
            return None, None
        for subfield_ndvis in subfield_groups:
            if len(subfield_ndvis) == 0:
                continue
            measurement_position = find_measurement_position(subfield_ndvis[0])
            measurement_ndvi = get_measurement_position_ndvi(
                ndvi_raster, [measurement_position.x, measurement_position.y]
            )
            data = {
                "longitude": measurement_position.x,
                "latitude": measurement_position.y,
                "ndvi": measurement_ndvi
            }
            inserted_measurement = insert_measurement(
                cursor, user_id, field_id, season_id, data
            )
            if inserted_measurement is not None:
                inserted_measurements.append(inserted_measurement)
                for subfield, ndvi in subfield_ndvis:
                    inserted_subfields.append(
                        insert_subfield(
                            cursor,
                            user_id, field_id, season_id, inserted_measurement["id"],
                            subfield.__str__(), ndvi
                        )
                    )
    if db_cursor.error is None:
        return inserted_measurements, inserted_subfields
    else:
        return None, None


def modify_measurement(
    user_id: int, measurement_id: int, data: dict[str, Any]
) -> tuple[dict[str, Any], dict[str, float | int | None]] | tuple[None, None]:
    updated_measurement = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        measurement = select_measurement(cursor, user_id, measurement_id)
        if measurement is None:
            return None, None
        field_id, season_id = measurement["field_id"], measurement["season_id"]
        season = select_season(cursor, user_id, field_id, season_id)
        if season is None:
            return None, None
        subfields = select_subfields(cursor, user_id, field_id, season_id)
        if subfields is None:
            return None, None
        updated_measurement = update_measurement(
            cursor, user_id, measurement_id, data
        )
        if updated_measurement is None:
            return None, None
        subfield_recommended_fertilizer: dict[str, float | int | None] = {}
        for subfield in subfields:
            if subfield["measurement_id"] == measurement_id:
                subfield_id = subfield["id"]
                recommended_fertilizer = recommend_subfield_fertilizer(
                    subfield["ndvi"], updated_measurement
                )
                data = {"recommended_fertilizer_amount": recommended_fertilizer}
                update_subfield(cursor, user_id, subfield_id, data)
                subfield_recommended_fertilizer[subfield_id] = recommended_fertilizer
            else:
                recommended_fertilizer = subfield["recommended_fertilizer_amount"]
                recommended_fertilizer = recommended_fertilizer if recommended_fertilizer is not None else 0
    if db_cursor.error is None:
        return updated_measurement, subfield_recommended_fertilizer
    else:
        return None, None


def upload_measurement_sample(user_id: int, measurement_id: int) -> dict[str, Any] | None:
    updated_measurement = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        measurement = select_measurement(cursor, user_id, measurement_id)
        if measurement is None:
            return None
        if measurement["sample_image"]:
            os.remove(
                os.path.join(MEASUREMENT.data_folder,
                             measurement["sample_image"])
            )
        sample_image = str(uuid.uuid4())
        updated_measurement = update_measurement(
            cursor, user_id, measurement_id, {"sample_image": sample_image}
        )
    return updated_measurement if db_cursor.error is None else None


def modify_measurement_position(
    user_id: int, measurement_id: int, lonlat: tuple[float, float]
) -> dict[str, Any] | None:
    updated_measurement = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        measurement = select_measurement(cursor, user_id, measurement_id)
        field_id, season_id = measurement["field_id"], measurement["season_id"]
        ndvi_raster, _ = get_ndvi_raster(user_id, field_id, season_id)
        if ndvi_raster is None:
            return None
        lon, lat = lonlat
        ndvi = get_measurement_position_ndvi(ndvi_raster, lonlat)
        data = {"longitude": lon, "latitude": lat, "ndvi": ndvi}
        updated_measurement = update_measurement(
            cursor, user_id, measurement_id, data
        )
    return updated_measurement if db_cursor.error is None else None
