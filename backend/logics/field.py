from typing import Any
import os
from shapely.geometry import Polygon
from repos.store.storage import DbCursor
from repos.store.dafs.field import select_field, insert_field, delete_field, select_fields_ids
from repos.store.dafs.season import select_ndvi_rasters
from repos.store.dafs.measurement import select_sample_images
from config import NDVI, MEASUREMENT


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
    ndvi_rasters, measurement_sample_images = None, None
    with db_cursor as cursor:
        ndvi_rasters = select_ndvi_rasters(
            cursor, user_id, field_id
        )
        measurement_sample_images = select_sample_images(
            cursor, user_id, field_id
        )
        delete_field(cursor, user_id, field_id)
    if db_cursor.error is None:
        if ndvi_rasters is not None:
            try:
                for ndvi_raster in ndvi_rasters:
                    os.remove(os.path.join(NDVI.data_folder, ndvi_raster))
            except Exception as error:
                print("[Field API]", error)
        if measurement_sample_images is not None:
            try:
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
