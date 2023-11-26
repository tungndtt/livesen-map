from shapely.geometry import Polygon, Point
import random


def find_farthest_point_inside_polygon(polygon, num_points=100):
    # Create a bounding box to contain the polygon
    bbox = polygon.bounds
    min_x, min_y, max_x, max_y = bbox

    max_distance = 0
    farthest_point = None

    for _ in range(num_points):
        # Generate a random point inside the bounding box
        x = min_x + (max_x - min_x) * random.random()
        y = min_y + (max_y - min_y) * random.random()

        point = Point(x, y)
        if polygon.contains(point):
            distance = point.distance(polygon.exterior)
            if distance > max_distance:
                max_distance = distance
                farthest_point = point

    return farthest_point


if __name__ == "__main__":
    # Example usage:
    # Create your polygon here (replace with your actual polygon)
    polygon = Polygon([(0, 0), (0, 3), (3, 3), (3, 0)])

    # Find the farthest point inside the polygon
    farthest_point = find_farthest_point_inside_polygon(polygon)
    print(f"The farthest point inside the polygon: {farthest_point}")
