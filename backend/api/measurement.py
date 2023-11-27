from flask import Blueprint, jsonify
from api.authentication import authentication_required
from services.store.storage import DbCursor
from services.store.field import get_field
from services.store.measurement import list_measurements, insert_measurement, update_measurement
from services.store.subfield import insert_subfield
from services.raster.splitter import Splitter
from utils.helper import find_farthest_point_inside_polygon
from config import RASTEXTRACTOR
import os


api = Blueprint("measurement", __name__, url_prefix="/measurement")


@api.route("/<field_id>/<period_id>", methods=["GET"])
@authentication_required
def list_all_measurements(user_id, _, field_id, period_id):
    measurements = list_measurements(user_id, field_id, period_id)
    if measurements is not None:
        return measurements, 200
    else:
        return jsonify({"data": "Failed to retrieve measurements within given period"}), 500


@api.route("/determine_positions/<field_id>/<period_id>", methods=["GET"])
@authentication_required
def determine_measurement_positions(user_id, _, field_id, period_id):
    # TODO: split the field, determine the measurement positions
    field = get_field(user_id, field_id)
    if field is None:
        return jsonify({"data": "Cannot find the field"}), 404
    coordinates = field["coordinates"]
    tiff_file = None
    for ndvi_raster in field["ndvi_rasters"]:
        if ndvi_raster.startswith(period_id):
            raster_file = ndvi_raster[len(period_id) + 1:]
            tiff_file = os.path.join(RASTEXTRACTOR.data_folder, raster_file)
            break
    split_results = Splitter(tiff_file, coordinates).split()
    measurement_positions = [
        (find_farthest_point_inside_polygon(subfield), ndvi)
        for (subfield, ndvi) in split_results
    ]
    db_cursor = DbCursor()
    inserted_measurements, inserted_subfields = [], []
    with db_cursor as cursor:
        for measurement_position, ndvi in measurement_positions:
            data = {
                "longitude": measurement_position.x,
                "latitude": measurement_position.y,
                "ndvi_value": ndvi
            }
            inserted_measurements.append(
                insert_measurement(cursor, user_id, field_id, period_id, data)
            )
        for subfield, _ in split_results:
            inserted_subfields.append(
                insert_subfield(cursor, user_id, field_id,
                                period_id, subfield.__str__())
            )
    if db_cursor.error is None:
        return jsonify({"measurements": inserted_measurements, "subfields": inserted_subfields}), 201
    else:
        return jsonify({"data": "Failed to determine the measurement positions"}), 500


@api.route("/upgister/<measurement_id>", methods=["PUT"])
@authentication_required
def upgister_measurement(user_id, data, measurement_id):
    updated_measurement = update_measurement(user_id, measurement_id, data)
    if updated_measurement is not None:
        return updated_measurement, 200
    else:
        return jsonify({"data": "Failed to update the measurement"}), 500
