from shapely.geometry import Point, Polygon
import random


def find_measurement_position(coordinates, num_points=100):
    polygon = coordinates if isinstance(coordinates, Polygon)\
        else Polygon(*coordinates)
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
