import os
import math
import numpy as np
import rasterio
from rasterio.io import DatasetReader
from rasterio import features, mask, windows, warp, transform
from shapely.geometry import Polygon, MultiPolygon, Point, box
from shapely import unary_union
from config import NDVI


def __ndvi_range(raster_file: DatasetReader, n: int) -> list[tuple[float, float]]:
    width, height = raster_file.width, raster_file.height
    step = max(min(1024**2 // (width * 32), height), 1)
    ndvi_min, ndvi_max = 1.0, 0.0
    for row in range(0, height, step):
        window_height = min(step, height - row)
        window = windows.Window(0, row, width, window_height)
        windowed_raster = raster_file.read(1, window=window)
        windowed_raster = windowed_raster[windowed_raster >= 0]
        ndvi_min = min(ndvi_min, np.nanmin(windowed_raster))
        ndvi_max = max(ndvi_max, np.nanmax(windowed_raster))
    if n >= 2:
        d = ndvi_max - ndvi_min
        ndvi_ranges = [(ndvi_min - 1e-7, ndvi_min + d/n)]\
            + [(ndvi_min + d*i/n, ndvi_min + d*(i+1)/n) for i in range(1, n-1)]\
            + [(ndvi_min + d*(n-1)/n, ndvi_max)]
    else:
        ndvi_ranges = [(ndvi_min, ndvi_max)]
    return ndvi_ranges


def __pixel_based_chunk_split(raster_file: DatasetReader) -> list[list[Polygon]]:
    width, height = raster_file.width, raster_file.height
    n = 3
    result = [[] for _ in range(n)]
    ndvi_ranges = __ndvi_range(raster_file, n)
    # process maximal 1 MB chunk per step
    step = 2
    for row in range(0, height, step):
        window_height = min(step, height - row)
        window = windows.Window(0, row, width, window_height)
        windowed_raster = raster_file.read(1, window=window)
        windowed_bounds = warp.transform_bounds(raster_file.crs, "epsg:4326",
                                                *raster_file.window_bounds(window))
        windowed_transform = transform.from_bounds(*windowed_bounds,
                                                   width=width, height=window_height)
        for i, ndvi_range in enumerate(ndvi_ranges):
            windowed_mask = np.logical_and(
                ~np.isnan(windowed_raster),
                (ndvi_range[0] < windowed_raster)
                & (windowed_raster <= ndvi_range[1])
            )
            shapes = features.shapes(windowed_raster, windowed_mask,
                                     connectivity=4, transform=windowed_transform)
            for shape, _ in shapes:
                coordinates = shape["coordinates"]
                shell = coordinates[0]
                holes = None if len(coordinates) == 1 else coordinates[1:]
                result[i].append(Polygon(shell, holes))
            union = unary_union(result[i])
            result[i] = [union] if union.geom_type == "Polygon"\
                else list(union.geoms)
    return result


def __pixel_based_nochunk_split(
    raster_file: DatasetReader, max_subfields: int = 100
) -> list[list[Polygon]]:
    n = 3
    result = [[] for _ in range(n)]
    ndvi_ranges = __ndvi_range(raster_file, n)
    raster_data = raster_file.read(1)
    height, width = raster_file.height, raster_file.width
    # smooth_raster_data = raster_data
    smooth_raster_data = np.full_like(raster_data, -1)
    for row in range(height):
        for col in range(width):
            if raster_data[row, col] >= 0:
                # Extract the 3x3 neighborhood around the current element
                neighbor_pixels = raster_data[max(0, row-1):min(row+2, height),
                                              max(0, col-1):min(col+2, width)]
                neighbor_pixels = neighbor_pixels[
                    (neighbor_pixels >= 0) & ~np.isnan(neighbor_pixels)
                ]
                smooth_raster_data[row, col] = np.mean(neighbor_pixels)

    transformed_bounds = warp.transform_bounds(raster_file.crs, "epsg:4326",
                                               *raster_file.bounds)
    raster_transform = transform.from_bounds(*transformed_bounds,
                                             width=raster_file.width, height=raster_file.height)
    field_area = 0
    for row, ndvi_range in enumerate(ndvi_ranges):
        raster_mask = np.logical_and(
            ~np.isnan(smooth_raster_data),
            (ndvi_range[0] < smooth_raster_data)
            & (smooth_raster_data <= ndvi_range[1])
        )
        shapes = features.shapes(smooth_raster_data, raster_mask,
                                 connectivity=4, transform=raster_transform)
        polygons = []
        for shape, _ in shapes:
            coordinates = shape["coordinates"]
            shell = coordinates[0]
            holes = [] if len(coordinates) == 1 else coordinates[1:]
            polygons.append(Polygon(shell, holes))
        union = unary_union(polygons)
        if union.geom_type == "Polygon":
            result[row].append(union)
            field_area += union.area
        else:
            for polygon in union.geoms:
                result[row].append(polygon)
                field_area += polygon.area
    minimum_subfield_area = field_area / max_subfields
    small_subfields = []

    def __merge_and_remove_small_subfields(i):
        nonlocal small_subfields
        subfields = MultiPolygon(result[i]) if len(small_subfields) == 0\
            else unary_union(result[i] + small_subfields)
        result[i] = []
        small_subfields = []
        if subfields.geom_type == "Polygon":
            if subfields.area >= minimum_subfield_area:
                result[i].append(subfields)
            else:
                small_subfields.append(subfields)
        else:
            for polygon in subfields.geoms:
                if polygon.area >= minimum_subfield_area:
                    result[i].append(polygon)
                else:
                    small_subfields.append(polygon)
    for row in range(n-1):
        __merge_and_remove_small_subfields(row)
        __merge_and_remove_small_subfields(row+1)
    for row in range(n-1, 0, -1):
        __merge_and_remove_small_subfields(row)
        __merge_and_remove_small_subfields(row-1)
    return result


def __region_based_split(
    coordinates: list[list[list[float]]] | Polygon, max_regions: int = 100
) -> tuple[list[Polygon], float]:
    if isinstance(coordinates, Polygon):
        field = coordinates
    else:
        shell = coordinates[0]
        holes = coordinates[1:]
        field = Polygon(shell, holes)
    # field_bounds = field.minimum_rotated_rectangle.exterior.coords
    field_bounds = box(*field.bounds).exterior.coords
    n = math.floor(math.sqrt(max_regions))
    width = Point(field_bounds[0]).distance(Point(field_bounds[1]))
    height = Point(field_bounds[0]).distance(Point(field_bounds[3]))
    mid = math.sqrt(width * height)
    nrows, ncols = math.floor(n * height / mid), math.floor(n * width / mid)

    def vertex(r, c):
        coords = []
        for i in range(2):
            coords.append(
                (
                    field_bounds[0][i] * (nrows - r) * (ncols - c)
                    + field_bounds[1][i] * (nrows - r) * c
                    + field_bounds[2][i] * r * c
                    + field_bounds[3][i] * r * (ncols - c)
                ) / (nrows * ncols)
            )
        return coords
    regions = []
    sum_region_area = 0
    for r in range(nrows):
        for c in range(ncols):
            v1, v2, v3, v4 = (
                vertex(r, c),
                vertex(r, c+1),
                vertex(r+1, c+1),
                vertex(r+1, c),
            )
            region = Polygon([v1, v2, v3, v4, v1])
            sum_region_area += region.area
            intersection = field.intersection(region)
            if not intersection.is_empty:
                if intersection.geom_type == "MultiPolygon":
                    for intersected_region in intersection.geoms:
                        regions.append(intersected_region)
                else:
                    regions.append(intersection)
    return regions, sum_region_area/(nrows * ncols)


def __compute_average_ndvi(
    raster_file: DatasetReader, subfields: list[Polygon]
) -> list[tuple[Polygon, float]]:
    result = []
    transformed_bounds = warp.transform_bounds(raster_file.crs, "epsg:4326",
                                               *raster_file.bounds)
    raster_transform = transform.from_bounds(*transformed_bounds,
                                             width=raster_file.width, height=raster_file.height)
    subfield_transform = ~raster_transform
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


def get_subfields_pixel_based_split(tiff_file: str) -> list[list[tuple[Polygon, float]]]:
    with rasterio.open(os.path.join(NDVI.data_folder, tiff_file)) as raster_file:
        subfield_groups = __pixel_based_nochunk_split(raster_file, 256)
        result = []
        for subfields in subfield_groups:
            result.append(__compute_average_ndvi(raster_file, subfields))
        return result


def get_subfields_region_based_split(
    coordinates: list[list[list[float]]] | Polygon, tiff_file: str
) -> list[list[tuple[Polygon, float]]]:
    with rasterio.open(os.path.join(NDVI.data_folder, tiff_file)) as raster_file:
        regions, avg_region_area = __region_based_split(coordinates, 256)
        region_ndvis = __compute_average_ndvi(raster_file, regions)
        n = 3
        subfield_groups = [[] for _ in range(n)]
        ndvi_ranges = __ndvi_range(raster_file, n)
        for region, avg_ndvi in region_ndvis:
            for i in range(n):
                if avg_ndvi <= ndvi_ranges[i][1]:
                    subfield_groups[i].append(region)
                    break
        minimum_allowed_area = avg_region_area * 0.5
        for i in range(n):
            union = unary_union(subfield_groups[i])
            if union.geom_type == "Polygon" and union.area >= minimum_allowed_area:
                subfield_groups[i] = [union]
            else:
                subfield_groups[i] = [subfield for subfield in union.geoms
                                      if subfield.area >= minimum_allowed_area]
        result = []
        for subfields in subfield_groups:
            result.append(__compute_average_ndvi(raster_file, subfields))
        return result
