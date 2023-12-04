import rasterio
from rasterio import features, mask, windows, warp, transform
from shapely.geometry import Polygon, box
from shapely import unary_union
import numpy as np


def __split_field(raster_file):
    width, height = raster_file.width, raster_file.height
    n = 3
    result = [[] for _ in range(n)]
    ndvi_ranges = [(i/n, (i+1)/n) for i in range(n)]
    # process maximal 1 MB chunk per step
    step = min(1024**2 // (width * 32), height)
    for row in range(0, height, step):
        window_height = min(step, height - row)
        window = windows.Window(0, row, width, window_height)
        windowed_raster = raster_file.read(1, window=window)
        # raster_bounds = warp.transform_bounds(raster_file.crs, "epsg:4326",
        #                                   *raster_file.bounds)
        # raster_transform = transform.from_bounds(*raster_bounds,
        #                                         width=width, height=height)
        windowed_transform = raster_file.window_transform(window)
        for i, ndvi_range in enumerate(ndvi_ranges):
            windowed_mask = np.logical_and(
                ~np.isnan(windowed_raster),
                (ndvi_range[0] <= windowed_raster) & (
                    windowed_raster < ndvi_range[1])
            )
            shapes = features.shapes(windowed_raster, windowed_mask,
                                     connectivity=4, transform=windowed_transform)
            for shape, _ in shapes:
                result[i].append(Polygon(*shape["coordinates"]).bounds)
            union = unary_union(result[i])
            result[i] = [union] if union.geom_type == "Polygon" else union.geoms
    return result


def __compute_avg_ndvi(raster_file, subfields):
    result = []
    raster_transform = raster_file.transform
    for subfield in subfields:
        minx, miny, maxx, maxy = subfield.bounds
        min_col, min_row = rasterio.transform.rowcol(raster_transform,
                                                     minx, miny)
        max_col, max_row = rasterio.transform.rowcol(raster_transform,
                                                     maxx, maxy)
        row_start, row_end = (
            max(min_row - 1, 0),
            min(max_row + 1, raster_file.height)
        )
        col_start, col_end = (
            max(min_col - 1, 0),
            min(max_col + 1, raster_file.width)
        )
        step = min(
            100 * 1024 // ((col_end - col_start) * 32),
            row_end - row_start
        )
        count, total = 0, 0
        for row in range(row_start, row_end, step):
            window_height = min(step, row_end - row_start - row)
            window = windows.Window(col_start, row, col_end, window_height)
            windowed_raster = raster_file.read(1, window=window)
            windowed_subfield = subfield.intersection(
                box(*raster_file.window_bounds(window))
            )
            windowed_transform = raster_file.window_transform(window)
            windowed_mask = mask.geometry_mask(
                geometries=[windowed_subfield],
                out_shape=(window.height, window.width),
                transform=windowed_transform
            )
            windowed_condition = np.where(
                windowed_mask, -1, windowed_raster
            ) >= 0
            count += np.count_nonzero(windowed_condition)
            total += np.sum(np.where(windowed_condition, windowed_raster, 0))
        avg_ndvi = total / count
        result.append((subfield, avg_ndvi))
    return result


def get_subfield_split(tiff_file):
    with rasterio.open(tiff_file) as raster_file:
        subfield_groups = __split_field(raster_file)
        result = []
        for subfields in subfield_groups:
            result += __compute_avg_ndvi(raster_file, subfields)
        return result
