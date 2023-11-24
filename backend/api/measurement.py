from flask import Blueprint, jsonify
from services.store.measurement import list_measurements, insert_measurement, update_measurement
from services.raster.splitter import Splitter
from api.authentication import authentication_required


api = Blueprint("measurement", __name__, url_prefix="/measurement")


@api.route("/all/<field_id>/<period_id>", methods=["GET"])
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
    # data = None
    # inserted_measurement = insert_measurement(
    #     user_id, field_id, period_id, data
    # )
    # if inserted_measurement is not None:
    #     return inserted_measurement, 201
    # else:
    #     return jsonify({"data": "Failed to register the measurement"}), 500
    pass


@api.route("/upgister/<measurement_id>", methods=["PUT"])
@authentication_required
def upgister_measurement(user_id, data, measurement_id):
    updated_measurement = update_measurement(user_id, measurement_id, data)
    if updated_measurement is not None:
        return updated_measurement, 200
    else:
        return jsonify({"data": "Failed to update the measurement"}), 500
