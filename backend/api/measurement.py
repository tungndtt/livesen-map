import os
import uuid
from flask import Blueprint, jsonify, send_from_directory, request
from api.authentication import authentication_required
from api.season import handle_ndvi_raster
from services.store.storage import DbCursor
from services.store.dafs.season import get_season
from services.store.dafs.measurement import list_measurements, get_measurement, insert_measurement, update_measurement
from services.store.dafs.subfield import list_subfields, insert_subfield, update_subfield_recommended_fertilizer_amount
from services.notify.notifier import publish_event
from services.recommend.recommender import recommend_subfield_fertilizer
from libs.algo.subfield_split import get_subfields_region_based_split, get_subfields_pixel_based_split
from libs.algo.measurement_position import find_measurement_position
from libs.timeout.function_timeout import timeout_function
from config import MEASUREMENT


api = Blueprint("measurement", __name__, url_prefix="/measurement")


@api.route("/sample/<int:measurement_id>", methods=["GET"])
@authentication_required
def retrieve_sample_image(user_id, _, measurement_id):
    measurement = get_measurement(user_id, measurement_id)
    if measurement is not None:
        if measurement["sample_image"] is not None:
            return send_from_directory(MEASUREMENT.data_folder, measurement["sample_image"])
        else:
            return jsonify({"data": "No uploaded sample available"}), 404
    else:
        return jsonify({"data": "Cannot find measurement with given id"}), 404


@api.route("/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_measurements(user_id, _, field_id, season_id):
    measurements = list_measurements(user_id, field_id, season_id)
    if measurements is not None and len(measurements) > 0:
        return measurements, 200
    else:
        return jsonify({"data": "Failed to retrieve measurements within given period"}), 404


@api.route("/subfield/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_subfields(user_id, _, field_id, season_id):
    subfields = list_subfields(user_id, field_id, season_id)
    if subfields is not None and len(subfields) > 0:
        return subfields, 200
    else:
        return jsonify({"data": "Failed to retrieve all subfields"}), 404


@api.route("/position/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_measurement_positions(user_id, _, field_id, season_id):
    ndvi_raster, _ = handle_ndvi_raster(user_id, field_id, season_id)
    if ndvi_raster is None:
        return jsonify({"data": "Cannot determine NDVI map to perform subfield split"}), 404
    subfield_groups = timeout_function(
        20, get_subfields_pixel_based_split, ndvi_raster
    )
    # subfield_groups = get_subfields_region_based_split(coordinates, tiff_file)
    if subfield_groups is None:
        return jsonify({"data": "[Timeout] Field is too large and cannot be splitted into subfields"}), 413
    db_cursor = DbCursor()
    inserted_measurements, inserted_subfields = [], []
    with db_cursor as cursor:
        for subfield_ndvis in subfield_groups:
            if len(subfield_ndvis) == 0:
                continue
            sum_ndvi = 0
            for _, ndvi in subfield_ndvis:
                sum_ndvi += ndvi
            avg_ndvi = sum_ndvi / len(subfield_ndvis)
            closest_subfield, closest_ndvi = None, 2
            for subfield, ndvi in subfield_ndvis:
                if abs(ndvi - avg_ndvi) < abs(closest_ndvi - avg_ndvi):
                    closest_subfield = subfield
                    closest_ndvi = ndvi
            measurement_position = find_measurement_position(closest_subfield)
            data = {
                "longitude": measurement_position.x,
                "latitude": measurement_position.y,
                "ndvi": avg_ndvi
            }
            inserted_measurement = insert_measurement(user_id, field_id, season_id,
                                                      data,
                                                      cursor=cursor)
            if inserted_measurement is not None:
                inserted_measurements.append(inserted_measurement)
                for subfield, ndvi in subfield_ndvis:
                    inserted_subfields.append(
                        insert_subfield(user_id, field_id, season_id, inserted_measurement["id"],
                                        subfield.__str__(), ndvi,
                                        cursor=cursor)
                    )
    if db_cursor.error is None:
        if publish_event(user_id, "measurement.create",
                         {"field_id": field_id, "season_id": season_id,
                          "measurements": inserted_measurements, "subfields": inserted_subfields}):
            return jsonify({"data": "Successfully determine the measurement positions"}), 201
        else:
            return jsonify({"data": "Successfully determine the measurement positions but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to determine the measurement positions"}), 500


@api.route("/upgister/<int:measurement_id>", methods=["PUT"])
@authentication_required
def upgister_measurement(user_id, data, measurement_id):
    updated_measurement = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        measurement = get_measurement(user_id, measurement_id)
        if measurement is None:
            return jsonify({"data": "Cannot find measurement with the given id"}), 404
        field_id, season_id = measurement["field_id"], measurement["season_id"]
        season = get_season(user_id, field_id, season_id)
        if season is None:
            return jsonify({"data": "Cannot find season associated with the measurement"}), 404
        subfields = list_subfields(user_id, field_id, season_id)
        if subfields is None:
            return jsonify({"data": "Cannot find subfields associated with the measurement"}), 404
        updated_measurement = update_measurement(user_id, measurement_id,
                                                 data,
                                                 cursor=cursor)
        if updated_measurement is None:
            return jsonify({"data": "Failed to update the measurement"}), 500
        subfield_recommended_fertilizer = {}
        for subfield in subfields:
            if subfield["measurement_id"] == measurement_id:
                subfield_id = subfield["id"]
                recommended_fertilizer = recommend_subfield_fertilizer(subfield["ndvi"],
                                                                       updated_measurement)
                update_subfield_recommended_fertilizer_amount(subfield_id,
                                                              recommended_fertilizer,
                                                              cursor=cursor)
                subfield_recommended_fertilizer[subfield_id] = recommended_fertilizer
            else:
                recommended_fertilizer = subfield["recommended_fertilizer_amount"]
                recommended_fertilizer = recommended_fertilizer if recommended_fertilizer is not None else 0
    if db_cursor.error is None:
        if publish_event(user_id, "measurement.update_measurement",
                         {"field_id": updated_measurement["field_id"], "season_id": updated_measurement["season_id"],
                          "measurement": updated_measurement, "subfield_recommended_fertilizer": subfield_recommended_fertilizer}):
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
    measurement = get_measurement(user_id, measurement_id)
    if measurement is None:
        return jsonify({"data": "Cannot find measurement with the given id"}), 404
    if measurement["sample_image"]:
        os.remove(os.path.join(MEASUREMENT.data_folder,
                  measurement["sample_image"]))
    sample_image = str(uuid.uuid4())
    updated_measurement = update_measurement(
        user_id, measurement_id, {"sample_image": sample_image})
    if updated_measurement is not None:
        file.save(os.path.join(MEASUREMENT.data_folder, sample_image))
        if publish_event(user_id, "measurement.update_sample",
                         {"field_id": updated_measurement["field_id"], "season_id": updated_measurement["season_id"],
                          "measurement": updated_measurement}):
            return jsonify({"data": "Successfully upload the measurement sample image"}), 200
        else:
            return jsonify({"data": "Successfully upload the measurement sample image but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to upload the measurement sample image"}), 500


@api.route("/position/<int:measurement_id>", methods=["PUT"])
@authentication_required
def upgister_measurement_position(user_id, data, measurement_id):
    updated_measurement = update_measurement(user_id, measurement_id, data)
    if updated_measurement is not None:
        if publish_event(user_id, "measurement.update_position",
                         {"field_id": updated_measurement["field_id"], "season_id": updated_measurement["season_id"],
                          "measurement": updated_measurement}):
            return jsonify({"data": "Successfully update the measurement position"}), 200
        else:
            return jsonify({"data": "Successfully update the measurement position but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to update the measurement position"}), 500
