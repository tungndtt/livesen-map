import os
import uuid
from datetime import datetime, timedelta
import numpy as np
import xarray as xr
import rasterio
from rasterio import mask, windows
from shapely.geometry import Polygon, box
from config import NDVI, DOWNLOADER


__crs = "epsg:4326"


def __extract_bbox(polygon: Polygon, in_nc_file: str, out_tiff_file: str) -> None:
    data_array = xr.open_dataset(in_nc_file, chunks="auto")
    del data_array["NDVI"].attrs["grid_mapping"]
    label_map = {"lat": "y", "lon": "x"}
    if "time" in data_array:
        label_map["time"] = "band"
    data_array = data_array.rename(label_map)
    data_array.rio.write_crs(__crs, inplace=True)
    ndvi = data_array["NDVI"]
    min_x, min_y, max_x, max_y = polygon.bounds
    clipped_bbox = ndvi.rio.clip_box(min_x, min_y, max_x, max_y)
    clipped_bbox.rio.to_raster(out_tiff_file)


def __extract_polygon(polygon: Polygon, in_tiff_file: str, out_tiff_file: str) -> None:
    with rasterio.open(in_tiff_file) as raster_data:
        out_meta = raster_data.meta
        out_meta.update({
            "driver": "GTiff",
            "height": raster_data.height,
            "width": raster_data.width,
            "count": 1,
            "dtype": "float32",
            "crs": __crs,
        })
        with rasterio.open(out_tiff_file, "w", **out_meta) as dest:
            step = max(
                # process maximal 1 MB chunk per step
                min(
                    1024**2 // (raster_data.width * 32),
                    raster_data.height
                ),
                1
            )
            for row in range(0, raster_data.height, step):
                window_height = min(step, raster_data.height - row)
                window = windows.Window(
                    0, row, raster_data.width, window_height
                )
                windowed_raster_data = raster_data.read(1, window=window)
                windowed_polygon = polygon.intersection(
                    box(*raster_data.window_bounds(window))
                )
                windowed_mask = mask.geometry_mask(
                    geometries=[windowed_polygon],
                    out_shape=(window.height, window.width),
                    transform=raster_data.window_transform(window)
                )
                rescaled_windowed_raster_data = np.where(
                    windowed_mask, 0, windowed_raster_data
                )/125 - 1
                dest.write(rescaled_windowed_raster_data,
                           indexes=1, window=window)


def get_field_ndvi(coordinates: Polygon | list[list[list[float]]], season_id: str) -> tuple[str | None, datetime | None]:
    year, month, day = season_id[:4], season_id[4:6], season_id[6:]
    source_date = datetime(year=int(year), month=int(month), day=int(day))
    # check whether there is available data within 5 days
    nc_file = None
    for day_diff in range(6):
        for direction in [-1, 1]:
            date = source_date + direction * timedelta(days=day_diff)
            year = "%04d" % date.year
            month = "%02d" % date.month
            day = "%02d" % date.day
            file = f"{year}{month}{day}.nc"
            if os.path.isfile(os.path.join(DOWNLOADER.data_folder, file)):
                source_date = date
                nc_file = file
                break
        if nc_file is not None:
            break
    if nc_file is None:
        return None, None
    in_nc_file = os.path.join(DOWNLOADER.data_folder, nc_file)
    if not os.path.isdir(NDVI.data_folder):
        os.mkdir(NDVI.data_folder)
    tiff_file = str(uuid.uuid1()) + ".tiff"
    out_tiff_file = os.path.join(NDVI.data_folder, tiff_file)
    temp_tiff_file_1 = os.path.join(
        NDVI.data_folder, "temp_1_%s" % tiff_file
    )
    temp_tiff_file_2 = os.path.join(
        NDVI.data_folder, "temp_2_%s" % tiff_file
    )
    try:
        if isinstance(coordinates, Polygon):
            polygon = coordinates
        else:
            shell = coordinates[0]
            holes = coordinates[1:]
            polygon = Polygon(shell, holes)
        __extract_bbox(polygon, in_nc_file, temp_tiff_file_1)
        __extract_polygon(polygon, temp_tiff_file_1, temp_tiff_file_2)
        os.system("gdal_translate %s %s -co TILED=YES -co COMPRESS=DEFLATE" %
                  (temp_tiff_file_2, out_tiff_file))
    except Exception as error:
        print("[Field NDVI]", error)
        tiff_file = None
        if os.path.isfile(out_tiff_file):
            os.remove(out_tiff_file)
    finally:
        if os.path.isfile(temp_tiff_file_1):
            os.remove(temp_tiff_file_1)
        if os.path.isfile(temp_tiff_file_2):
            os.remove(temp_tiff_file_2)
    return tiff_file, source_date
