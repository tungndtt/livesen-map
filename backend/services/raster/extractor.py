import xarray as xr
import rasterio
from rasterio import mask, windows
from shapely.geometry import Polygon, box
import numpy as np
import uuid
import os
from config import RASTEXTRACTOR, DOWNLOADER


__crs = "epsg:4326"


def __read_ndvi_data(nc_file):
    data_array = xr.open_dataset(nc_file, chunks="auto")
    del data_array["NDVI"].attrs["grid_mapping"]
    label_map = {"lat": "y", "lon": "x"}
    if "time" in data_array:
        label_map["time"] = "band"
    data_array = data_array.rename(label_map)
    data_array.rio.write_crs(__crs, inplace=True)
    return data_array["NDVI"]


def __extract_bbox_raster(polygon, in_nc_file, out_tiff_file):
    ndvi = __read_ndvi_data(in_nc_file)
    min_x, min_y, max_x, max_y = Polygon(polygon).bounds
    clipped_bbox = ndvi.rio.clip_box(min_x, min_y, max_x, max_y)
    # # maximum improvement factor
    # max_improvement_factor = 6
    # # maximum improved data size = 1MB
    # max_improvement_size = 1024**2
    # data_size = clipped_bbox.shape[0] * clipped_bbox.shape[1] * 4
    # improvement_factor = min(
    #     max_improvement_factor,
    #     max_improvement_size / data_size
    # )
    # if improvement_factor > 1:
    #     x_resolution, y_resolution = ndvi.rio.resolution()
    #     reprojected_bbox = clipped_bbox.rio.reproject(
    #         __crs, resolution=min(
    #             abs(x_resolution), abs(y_resolution)
    #         ) / improvement_factor
    #     )
    #     reprojected_bbox.rio.to_raster(out_tiff_file)
    # else:
    #     clipped_bbox.rio.to_raster(out_tiff_file)
    clipped_bbox.rio.to_raster(out_tiff_file)


def __extract_polygon_raster(polygon, in_tiff_file, out_tiff_file):
    with rasterio.open(in_tiff_file) as raster_data:
        out_meta = raster_data.meta
        out_meta.update({
            "driver": "GTiff",
            "height": raster_data.height,
            "width": raster_data.width,
            "count": 1,
            "dtype": "uint8",
            "crs": __crs,
        })
        with rasterio.open(out_tiff_file, "w", **out_meta) as dest:
            geometry = Polygon(polygon)
            # process maximal 1 MB chunk per step
            step = min(
                1024**2 // (raster_data.width * 32),
                raster_data.height
            )
            for row in range(0, raster_data.height, step):
                window_height = min(step, raster_data.height - row)
                window = windows.Window(
                    0, row, raster_data.width, window_height
                )
                windowed_raster_data = raster_data.read(1, window=window)
                windowed_geometry = geometry.intersection(
                    box(*raster_data.window_bounds(window))
                )
                windowed_mask = mask.geometry_mask(
                    geometries=[windowed_geometry],
                    out_shape=(window.height, window.width),
                    transform=raster_data.window_transform(window)
                )
                window_grey_channel = np.where(
                    windowed_mask, 255, windowed_raster_data
                )
                # window_alpha_channel = np.where(windowed_mask, 0, 255)
                # window_rgba_image = np.dstack((
                #     window_grey_channel,
                #     window_grey_channel,
                #     window_grey_channel,
                #     window_alpha_channel
                # )).astype(np.uint8)
                # dest.write(window_rgba_image.transpose(2, 0, 1), window=window)
                dest.write(window_grey_channel, indexes=1, window=window)


def extract_raster(polygon, in_nc_file, out_tiff_file=None):
    in_nc_file = os.path.join(DOWNLOADER.data_folder, in_nc_file)
    if not os.path.isdir(RASTEXTRACTOR.data_folder):
        os.mkdir(RASTEXTRACTOR.data_folder)
    if out_tiff_file is None:
        tiff_file = str(uuid.uuid1()) + ".tiff"
    else:
        tiff_file = out_tiff_file
    out_tiff_file = os.path.join(RASTEXTRACTOR.data_folder, tiff_file)
    temp_tiff_file_1 = os.path.join(
        RASTEXTRACTOR.data_folder, "temp_1_%s" % tiff_file)
    temp_tiff_file_2 = os.path.join(
        RASTEXTRACTOR.data_folder, "temp_2_%s" % tiff_file)
    try:
        __extract_bbox_raster(polygon, in_nc_file, temp_tiff_file_1)
        __extract_polygon_raster(polygon, temp_tiff_file_1, temp_tiff_file_2)
        os.system("gdal_translate %s %s -co TILED=YES -co COMPRESS=DEFLATE" %
                  (temp_tiff_file_2, out_tiff_file))
    except Exception as error:
        print("[Rastextractor]", error)
        tiff_file = None
        if os.path.isfile(out_tiff_file):
            os.remove(out_tiff_file)
    finally:
        if os.path.isfile(temp_tiff_file_1):
            os.remove(temp_tiff_file_1)
        if os.path.isfile(temp_tiff_file_2):
            os.remove(temp_tiff_file_2)
    return tiff_file


if __name__ == "__main__":
    def pyarr_to_clydedacruz(pyarr):
        clydedacruz = ""
        for i, point in enumerate(pyarr):
            x, y = point
            clydedacruz += f"{x} {y}"
            clydedacruz += "," if i < len(pyarr) - 1 else ""
        print(clydedacruz)

    def clydedacruz_to_pyarr(clydedacruz):
        pyarr = []
        points = clydedacruz.split(",")
        for point in points:
            str_x, str_y = point.split(" ")
            pyarr.append([int(str_x), int(str_y)])
        print(pyarr)

    import json
    in_nc_file = "20200621.nc"
    with open(os.path.join("data", "geometry", "polygons.json"), "r") as f:
        polygons = json.load(f)
    for size in polygons.keys():
        polygon = polygons[size]
        out_tiff_file = f"{size}.tiff"
        extract_raster(polygon, in_nc_file, out_tiff_file)
