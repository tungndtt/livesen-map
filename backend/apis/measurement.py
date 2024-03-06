import os
from flask import Blueprint, jsonify, send_from_directory, request
from apis.authentication import authentication_required
from logics.measurement import get_sample_image, get_measurements, get_subfields, get_measurement_positions, modify_measurement, upload_measurement_sample, modify_measurement_position
from logics.event import publish
from config import MEASUREMENT


api = Blueprint("measurement", __name__, url_prefix="/measurement")


@api.route("/sample/<int:measurement_id>", methods=["GET"])
@authentication_required
def retrieve_sample_image(user_id, _, measurement_id):
    sample_image = get_sample_image(user_id, measurement_id)
    if sample_image is not None:
        return send_from_directory(MEASUREMENT.data_folder, sample_image)
    else:
        return jsonify({"data": "No uploaded sample available"}), 404


@api.route("/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_measurements(user_id, _, field_id, season_id):
    measurements = get_measurements(user_id, field_id, season_id)
    if measurements is not None and len(measurements) > 0:
        return measurements, 200
    else:
        return jsonify({"data": "Failed to retrieve measurements within given period"}), 404


@api.route("/subfield/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_subfields(user_id, _, field_id, season_id):
    subfields = get_subfields(user_id, field_id, season_id)
    if subfields is not None and len(subfields) > 0:
        return subfields, 200
    else:
        return jsonify({"data": "Failed to retrieve all subfields"}), 404


@api.route("/position/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_measurement_positions(user_id, _, field_id, season_id):
    inserted_measurements, inserted_subfields = get_measurement_positions(
        user_id, field_id, season_id)
    if inserted_measurements is not None:
        if publish(
            user_id, "measurement.create",
            {"field_id": field_id,
             "season_id": season_id,
             "measurements": inserted_measurements,
             "subfields": inserted_subfields}
        ):
            return jsonify({"data": "Successfully determine the measurement positions"}), 201
        else:
            return jsonify({"data": "Successfully determine the measurement positions but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to determine the measurement positions"}), 500


@api.route("/upgister/<int:measurement_id>", methods=["PUT"])
@authentication_required
def upgister_measurement(user_id, data, measurement_id):
    updated_measurement, subfield_recommended_fertilizer = modify_measurement(
        user_id, measurement_id, data)
    if updated_measurement is not None:
        if publish(
            user_id, "measurement.update_measurement",
            {"field_id": updated_measurement["field_id"],
             "season_id": updated_measurement["season_id"],
             "measurement": updated_measurement,
             "subfield_recommended_fertilizer": subfield_recommended_fertilizer}
        ):
            return jsonify({"data": "Successfully update the measurement"}), 200
        else:
            return jsonify({"data": "Successfully update the measurement but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to update the measurement"}), 500


@api.route("/sample/<int:measurement_id>", methods=["PUT"])
@authentication_required
def upgister_measurement_sample(user_id, _, measurement_id):
    if "file" not in request.files:
        return jsonify({"data": "No uploaded measurement sample image"}), 404
    file = request.files["file"]
    updated_measurement = upload_measurement_sample(user_id, measurement_id)
    if updated_measurement is not None:
        file.save(
            os.path.join(MEASUREMENT.data_folder,
                         updated_measurement["sample_image"])
        )
        if publish(
            user_id, "measurement.update_sample",
            {"field_id": updated_measurement["field_id"],
             "season_id": updated_measurement["season_id"],
             "measurement": updated_measurement}
        ):
            return jsonify({"data": "Successfully upload the measurement sample image"}), 200
        else:
            return jsonify({"data": "Successfully upload the measurement sample image but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to upload the measurement sample image"}), 500


@api.route("/position/<int:measurement_id>", methods=["PUT"])
@authentication_required
def upgister_measurement_position(user_id, data, measurement_id):
    lon, lat = data["longitude"], data["latitude"]
    updated_measurement = modify_measurement_position(
        user_id, measurement_id, (lon, lat)
    )
    if updated_measurement is not None:
        if publish(
            user_id, "measurement.update_position",
            {"field_id": updated_measurement["field_id"],
             "season_id": updated_measurement["season_id"],
             "measurement": updated_measurement}
        ):
            return jsonify({"data": "Successfully update the measurement position"}), 200
        else:
            return jsonify({"data": "Successfully update the measurement position but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to update the measurement position"}), 500
