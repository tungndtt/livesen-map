import os
from repos.store.storage import DbCursor
from repos.store.dafs.season import select_ndvi_rasters
from repos.store.dafs.measurement import select_sample_images
from repos.ndvi.raster import unregister_parcel
from config import NDVI, MEASUREMENT


def season_unregistration_callback(user_id: int, field_id: int, season_id: str | None = None):
    db_cursor = DbCursor()
    ndvi_rasters = None
    with db_cursor as cursor:
        ndvi_rasters = select_ndvi_rasters(
            cursor, user_id, field_id, season_id
        )
    def task():
        nonlocal db_cursor, ndvi_rasters
        if db_cursor.error is not None or ndvi_rasters is None:
            return
        try:
            for ndvi_raster, parcel_id in ndvi_rasters:
                if parcel_id is not None:
                    unregister_parcel(parcel_id)
                if ndvi_raster is not None:
                    os.remove(os.path.join(NDVI.data_folder, ndvi_raster))
        except Exception as error:
            print("[Season Callback]", error)
    return task


def measurement_unregistration_callback(user_id: int, field_id: int, season_id: str | None = None):
    db_cursor = DbCursor()
    measurement_sample_images = None
    with db_cursor as cursor:
        measurement_sample_images = select_sample_images(
            cursor, user_id, field_id, season_id
        )
    def task():
        nonlocal db_cursor, measurement_sample_images
        if db_cursor.error is not None or measurement_sample_images is None:
            return
        try:
            for measurement_sample_image in measurement_sample_images:
                if measurement_sample_image is not None:
                    os.remove(
                        os.path.join(MEASUREMENT.data_folder,
                                    measurement_sample_image)
                    )
        except Exception as error:
            print("[Measurement Callback]", error)
    return task