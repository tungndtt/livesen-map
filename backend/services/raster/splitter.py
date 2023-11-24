import rasterio
from rasterio.mask import geometry_mask
from rasterio.windows import Window
from shapely.geometry import Polygon, Point, box
from shapely.ops import unary_union
from math import floor
import numpy as np


class Splitter:
    def __init__(self, tiff_file, coordinates, init_split=2, split_factor=2, max_subfields=100):
        self.__raster = rasterio.open(tiff_file)
        self.__polygon = Polygon(coordinates)
        self.__init_split = init_split
        self.__split_factor = split_factor
        self.__max_subfields = max_subfields

    def split(self):
        bbox = self.__polygon.minimum_rotated_rectangle
        bbox_coordinates = bbox.exterior.coords
        bbox_side1 = Point(bbox_coordinates[0])\
            .distance(Point(bbox_coordinates[1]))
        bbox_side2 = Point(bbox_coordinates[0])\
            .distance(Point(bbox_coordinates[3]))
        split_side = min(bbox_side1, bbox_side2) / self.__init_split
        side1_split, side2_split = (
            floor(bbox_side1/split_side), floor(bbox_side2/split_side)
        )
        if side1_split * side2_split > self.__max_subfields:
            split_side *= self.__max_subfields / (side1_split * side2_split)
            side1_split, side2_split = (
                floor(bbox_side1/split_side), floor(bbox_side2/split_side)
            )
        # recursively determine the maximum split factor
        maximum_split_factor = 1
        for i1 in range(side1_split):
            for i2 in range(side2_split):
                subfield = self.__subfield(
                    bbox,
                    i1, i2,
                    side1_split, side2_split
                )
                maximum_split_factor = max(
                    self.__determine_maximum_split_factor(
                        subfield,
                        side1_split, side2_split
                    ),
                    maximum_split_factor
                )
        # split the field, classify based on the intensity and then merge
        side1_split *= maximum_split_factor
        side2_split *= maximum_split_factor
        subfields = self.__merge_classified_subfields(
            bbox,
            side1_split, side2_split
        )
        return [(subfield, self.__compute_intensity(subfield)) for subfield in subfields]

    def __merge_classified_subfields(self, field, side1_split, side2_split):
        categories = [[], [], []]
        for i1 in range(side1_split):
            for i2 in range(side2_split):
                subfield = self.__subfield(
                    field,
                    i1, i2,
                    side1_split, side2_split
                )
                intersection = self.__polygon.intersection(subfield)
                if intersection.geom_type == "Polygon" and not intersection.is_empty:
                    intensity = self.__compute_intensity(intersection)
                    category = min(intensity * 3, 2)
                    categories[category].append(intersection)
        # merge the neighbor subfields in same category
        result = []
        for subfields in categories:
            union = unary_union(subfields)
            polygons = [
                polygon for polygon in union.geoms
            ] if union.geom_type == "MultiPolygon" else [union]
            for polygon in polygons:
                # Only the subfields which are large-enough
                if polygon.area >= self.__polygon.area * 0.005:
                    result.append(polygon)
        return result

    def __subfield(self, field, i1, i2, side1_split, side2_split):
        v1, v2, v3, v4 = (
            self.__field_vertex(
                field,
                i1, i2,
                side1_split, side2_split
            ),
            self.__field_vertex(
                field,
                i1, i2+1,
                side1_split, side2_split
            ),
            self.__field_vertex(
                field,
                i1+1, i2+1,
                side1_split, side2_split
            ),
            self.__field_vertex(
                field,
                i1+1, i2,
                side1_split, side2_split
            )
        )
        return Polygon([v1, v2, v3, v4, v1])

    def __field_vertex(self, field, i1, i2, side1_split, side2_split):
        field_coords = field.exterior.coords
        return [
            (
                field_coords[0][i] * (side1_split - i1) * (side2_split - i2)
                + field_coords[1][i] * (side1_split - i1) * i2
                + field_coords[2][i] * i1 * i2
                + field_coords[3][i] * i1 * (side2_split - i2)
            ) / (side1_split * side2_split)
            for i in range(2)
        ]

    def __determine_maximum_split_factor(self, field, side1_split, side2_split):
        maximum_split_factor = 1
        intersection = self.__polygon.intersection(field)
        total_area = sum(
            polygon.area
            for polygon in (intersection.geoms if intersection.geom_type == "MultiPolygon"
                            else [intersection])
        )
        # small subfield does not have enough population to vote and hence, cannot participate in split determination
        if total_area <= field.area * 0.25:
            return maximum_split_factor
        # cannot split into too-small subfields
        if side1_split * side2_split * self.__split_factor**2 > self.__max_subfields:
            return maximum_split_factor
        subfields_intensities = []
        subfields = []
        field_intensity = self.__compute_intensity(field)
        for i1 in range(self.__split_factor):
            for i2 in range(self.__split_factor):
                subfield = self.__subfield(
                    field,
                    i1, i2,
                    self.__split_factor, self.__split_factor
                )
                subfields.append(subfield)
                subfields_intensities.append(
                    self.__compute_intensity(subfield)
                )
        if abs(field_intensity - sum(subfields_intensities)/len(subfields_intensities)) >= 0.17:
            side1_split *= self.__split_factor
            side2_split *= self.__split_factor
            for subfield in subfields:
                maximum_split_factor = max(
                    self.__split_factor * self.__determine_maximum_split_factor(
                        subfield, side1_split, side2_split
                    ),
                    maximum_split_factor
                )
        return maximum_split_factor

    def __compute_intensity(self, field):
        raster_minx, raster_miny, raster_maxx, raster_maxy = self.__raster.bounds
        field_minx, field_miny, field_maxx, field_maxy = field.bounds
        raster_height, raster_width = self.__raster.shape
        origin = Point(raster_minx, raster_miny)
        height = Point(raster_minx, raster_maxy).distance(origin)
        rows = []
        for field_y in [field_miny, field_maxy]:
            dy = Point(raster_minx, field_y).distance(origin)\
                if raster_miny <= field_y else 0
            rows.append(floor(raster_height * min(dy/height, 1)))
        row_start, row_end = (
            max(rows[0] - 1, 0),
            min(rows[1] + 1, raster_height)
        )
        cols = []
        width = Point(raster_maxx, raster_miny).distance(origin)
        for field_x in [field_minx, field_maxx]:
            dx = Point(field_x, raster_miny).distance(origin)\
                if raster_minx <= field_x else 0
            cols.append(floor(raster_width * min(dx/width, 1)))
        col_start, col_end = (
            max(cols[0] - 1, 0),
            min(cols[1] + 1, raster_width)
        )
        step = min(
            100 * 1024 // ((col_end - col_start) * 32),
            row_end - row_start
        )
        count, total = 0, 0
        for row in range(row_start, row_end, step):
            window_height = min(step, row_end - row_start - row)
            window = Window(col_start, row, col_end, window_height)
            windowed_raster = self.__raster.read(1, window=window)
            windowed_field = field.intersection(
                box(*self.__raster.window_bounds(window))
            )
            windowed_mask = geometry_mask(
                geometries=[windowed_field],
                out_shape=(window.height, window.width),
                transform=self.__raster.window_transform(window)
            )
            # convert the pixel range [0, 255] to ndvi range [-1, 1]
            windowed_ndvi = (
                255 - np.where(windowed_mask, 255, windowed_raster)
            )/127.5 - 1
            # only consider animate objects -> ndvi value >= 0
            windowed_condition = windowed_ndvi >= 0
            count += np.count_nonzero(windowed_condition)
            total += np.sum(np.where(windowed_condition, windowed_ndvi, 0))
        return -1 if count == 0 else total/count


def split_polygon(coordinates, nrows, ncols):
    polygon = Polygon(coordinates)
    bbox = polygon.minimum_rotated_rectangle
    bbox_vertices = []
    for coord in bbox.exterior.coords:
        bbox_vertices.append(coord)

    def vertex(r, c):
        coords = []
        for i in range(2):
            coords.append(
                (
                    bbox_vertices[0][i] * (nrows - r) * (ncols - c)
                    + bbox_vertices[1][i] * (nrows - r) * c
                    + bbox_vertices[2][i] * r * c
                    + bbox_vertices[3][i] * r * (ncols - c)
                ) / (nrows * ncols)
            )
        return coords
    splitted = []
    for r in range(nrows):
        for c in range(ncols):
            v1, v2, v3, v4 = (
                vertex(r, c),
                vertex(r, c+1),
                vertex(r+1, c+1),
                vertex(r+1, c),
            )
            cell = Polygon([v1, v2, v3, v4, v1])
            splitted.append(polygon.intersection(cell))
    return splitted


if __name__ == "__main__":
    # coordinates = [
    #     [8.886503845831603, 49.54622931226356],
    #     [8.91138650901199, 49.29755767335067],
    #     [9.41130183290884, 49.02983032640225],
    #     [9.922527458251324, 49.04762501572955],
    #     [8.886503845831603, 49.54622931226356]
    # ]
    # coordinates = [
    #     [8.675903328694405, 49.51653357429925],
    #     [8.613281250000002, 49.34213951817052],
    #     [9.103820817545058, 49.34321349061963],
    #     [9.067016635090114, 49.545420153382736],
    #     [8.836853052489461, 49.597800349541274],
    #     [8.675903328694405, 49.51653357429925],
    # ]
    # splitted = split_polygon(coordinates, 4, 4)
    # print(len(splitted))
    # print(splitted)
    # multi_polygons = ",".join(polygon.__str__()[len("POLYGON"):] for polygon in [
    #     Polygon(coordinates), *splitted] if not polygon.is_empty)
    # print("MULTIPOLYGON(%s)" % multi_polygons)
    c1 = [[9.119338989257812, 49.34928279658786],
          [9.06715393066406, 49.270492794711544],
          [9.25666809082031, 49.2615314114841],
          [9.119338989257812, 49.34928279658786]]
    c2 = [[9.25666809082031, 49.2615314114841],
          [9.294605255126955, 49.23060214495155],
          [9.330310821533203, 49.28393181795619],
          [9.25666809082031, 49.2615314114841]]
    print(unary_union([Polygon(c1), Polygon(c2)]))
