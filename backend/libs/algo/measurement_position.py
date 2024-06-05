import os
import random
from shapely.geometry import Point, Polygon
import rasterio
from pyproj import Transformer
from config import NDVI


def find_measurement_position(
    coordinates: list[list[list[float]]] | Polygon,
    num_points: int = 100
) -> Point:
    if isinstance(coordinates, Polygon):
        polygon = coordinates
    else:
        shell = coordinates[0]
        holes = coordinates[1:]
        polygon = Polygon(shell, holes)
    centroid = polygon.centroid
    if polygon.contains(centroid):
        return centroid
    bbox = polygon.bounds
    min_x, min_y, max_x, max_y = bbox
    max_distance = 0
    farthest_point = None
    for _ in range(num_points):
        x = min_x + (max_x - min_x) * random.random()
        y = min_y + (max_y - min_y) * random.random()
        point = Point(x, y)
        if polygon.contains(point):
            distance = point.distance(polygon.exterior)
            if distance > max_distance:
                max_distance = distance
                farthest_point = point
    return farthest_point


def get_measurement_position_ndvi(tiff_file: str, coordinate: list[float]) -> float:
    with rasterio.open(os.path.join(NDVI.data_folder, tiff_file)) as raster_file:
        transformer = Transformer.from_crs("epsg:4326", raster_file.crs)
        transformed_coordinate =  transformer.transform(coordinate[1], coordinate[0])
        ndvi = next(raster_file.sample([transformed_coordinate], 1))
        return float(ndvi[0])
