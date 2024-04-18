import os
import math
import numpy as np
import rasterio
from rasterio.io import DatasetReader
from rasterio import features, mask, windows, warp, transform
from shapely.geometry import Polygon, box
from shapely import unary_union
from config import NDVI


def __ndvi_range(raster_data, n: int) -> list[tuple[float, float]]:
    raster_data = raster_data[raster_data >= 0]
    ndvi_min = np.nanmin(raster_data)
    ndvi_max = np.nanmax(raster_data)
    d = ndvi_max - ndvi_min
    ndvi_ranges = [(ndvi_min - 1e-7, ndvi_min + d/n)]\
        + [(ndvi_min + d*i/n, ndvi_min + d*(i+1)/n) for i in range(1, n-1)]\
        + [(ndvi_min + d*(n-1)/n, ndvi_max)]
    return ndvi_ranges


def __polygon(coordinates) -> Polygon:
    shell = coordinates[0]
    holes = [] if len(coordinates) == 1 else coordinates[1:]
    return Polygon(shell, holes)


def __transform(raster_file: DatasetReader):
    transformed_bounds = warp.transform_bounds(raster_file.crs, "epsg:4326",
                                               *raster_file.bounds)
    raster_transform = transform.from_bounds(*transformed_bounds,
                                             width=raster_file.width, height=raster_file.height)
    return raster_transform


def __pixel_based_nochunk_split(
    raster_file: DatasetReader, coordinates: list[list[list[float]]]
) -> list[list[Polygon]]:
    n = 3
    result = [[] for _ in range(n)]
    raster_transform = __transform(raster_file)
    raster_mask = mask.geometry_mask(
        geometries=[__polygon(coordinates)],
        out_shape=(raster_file.height, raster_file.width),
        transform=raster_transform
    )
    raster_data = np.where(raster_mask, -1, raster_file.read(1))
    ndvi_ranges = __ndvi_range(raster_data, n)
    for row, ndvi_range in enumerate(ndvi_ranges):
        raster_mask = np.logical_and(
            ~np.isnan(raster_data),
            (ndvi_range[0] < raster_data)
            & (raster_data <= ndvi_range[1])
        )
        shapes = features.shapes(raster_data, raster_mask,
                                 connectivity=4, transform=raster_transform)
        polygons = [__polygon(shape["coordinates"]) for shape, _ in shapes]
        union = unary_union(polygons)
        if union.geom_type == "Polygon":
            result[row].append(union)
        else:
            for polygon in union.geoms:
                result[row].append(polygon)
    return result


def __compute_average_ndvi(
    raster_file: DatasetReader, subfields: list[Polygon]
) -> list[tuple[Polygon, float]]:
    result = []
    subfield_transform = ~__transform(raster_file)
    for subfield in subfields:
        minx, miny, maxx, maxy = subfield.bounds
        col_start, row_start, col_end, row_end = raster_file.width, raster_file.height, 0, 0
        for point in ([minx, miny], [minx, maxy], [maxx, miny], [maxx, maxy]):
            x, y = subfield_transform * point
            col_start = min(col_start, math.floor(x))
            row_start = min(row_start, math.floor(y))
            col_end = max(col_end, math.ceil(x))
            row_end = max(row_end, math.ceil(y))
        if (
            col_start >= raster_file.width
            or col_end <= 0
            or row_start >= raster_file.height
            or row_end <= 0
        ):
            continue
        window = windows.Window(col_start, row_start, col_end, row_end)
        windowed_raster = raster_file.read(1, window=window)
        windowed_bounds = warp.transform_bounds(raster_file.crs, "epsg:4326",
                                                *raster_file.window_bounds(window))
        windowed_transform = transform.from_bounds(*windowed_bounds,
                                                   width=window.width, height=window.height)
        windowed_subfield = subfield.intersection(box(*windowed_bounds))
        if (
            not windowed_subfield.is_empty
            and windowed_raster.shape[0] > 0
            and windowed_raster.shape[1] > 0
        ):
            windowed_mask = mask.geometry_mask(
                geometries=[windowed_subfield],
                all_touched=True,
                out_shape=windowed_raster.shape,
                transform=windowed_transform
            )
            windowed_condition = np.where(
                windowed_mask, -1, windowed_raster
            ) >= 0
            count = np.count_nonzero(windowed_condition)
            total = np.sum(
                np.where(windowed_condition, windowed_raster, 0)
            )
            if count > 0:
                average_ndvi = total / count
                result.append((subfield, average_ndvi))
    return result


def get_subfields_pixel_based_split(
    tiff_file: str, coordinates: list[list[list[float]]]
) -> list[list[tuple[Polygon, float]]] | None:
    try:
        with rasterio.open(os.path.join(NDVI.data_folder, tiff_file)) as raster_file:
            subfield_groups = __pixel_based_nochunk_split(raster_file, coordinates)
            result = []
            for subfields in subfield_groups:
                result.append(__compute_average_ndvi(raster_file, subfields))
        return result
    except Exception as error:
        print("[Subfield Split]", error)
        return None
