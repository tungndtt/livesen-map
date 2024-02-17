from flask import Blueprint, jsonify
from api.authentication import authentication_required
from api.ndvi_raster import handle_ndvi_raster
from services.store.storage import DbCursor
from services.store.dafs.season import get_season
from services.store.dafs.measurement import list_measurements, get_measurement, insert_measurement, update_measurement
from services.store.dafs.subfield import list_subfields, insert_subfield, update_subfield_recommended_fertilizer_amount
from services.notify.notifier import publish_event
from libs.algo.subfield_split import get_subfields_region_based_split, get_subfields_pixel_based_split
from libs.algo.measurement_position import find_measurement_position
from libs.algo.fertilizer_recommendation import compute_fertilizer_recommendation
from libs.timeout.function_time import timeout_function


api = Blueprint("measurement", __name__, url_prefix="/measurement")


@api.route("/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_measurements(user_id, _, field_id, season_id):
    measurements = list_measurements(user_id, field_id, season_id)
    if measurements is not None and len(measurements) > 0:
        return measurements, 200
    else:
        return jsonify({"data": "Failed to retrieve measurements within given period"}), 500


@api.route("/subfield/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_subfields(user_id, _, field_id, season_id):
    subfields = list_subfields(user_id, field_id, season_id)
    if subfields is not None and len(subfields) > 0:
        return subfields, 200
    else:
        return jsonify({"data": "Failed to retrieve all subfields"}), 500


@api.route("/position/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_measurement_positions(user_id, _, field_id, season_id):
    response, status_code = handle_ndvi_raster(user_id, field_id, season_id)
    if status_code >= 400:
        return response, status_code
    ndvi_raster, _ = response.get_json()["data"]
    subfield_groups = timeout_function(
        20, get_subfields_pixel_based_split, ndvi_raster
    )
    # subfield_groups = get_subfields_region_based_split(coordinates, tiff_file)
    if subfield_groups is None:
        return jsonify({"data": "[Timeout] Field is too large and cannot be splitted into subfields"}), 500
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
        publish_event(user_id, "measurement.create",
                      {"field_id": field_id, "season_id": season_id,
                       "measurements": inserted_measurements, "subfields": inserted_subfields})
        return jsonify({"data": "Successfully determine the measurement positions"}), 201
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
                recommended_fertilizer = compute_fertilizer_recommendation(subfield["ndvi"],
                                                                           updated_measurement)
                update_subfield_recommended_fertilizer_amount(subfield_id,
                                                              recommended_fertilizer,
                                                              cursor=cursor)
                subfield_recommended_fertilizer[subfield_id] = recommended_fertilizer
            else:
                recommended_fertilizer = subfield["recommended_fertilizer_amount"]
                recommended_fertilizer = recommended_fertilizer if recommended_fertilizer is not None else 0
    if db_cursor.error is None:
        publish_event(user_id, "measurement.update_measurement",
                      {"field_id": updated_measurement["field_id"], "season_id": updated_measurement["season_id"],
                       "measurement": updated_measurement, "subfield_recommended_fertilizer": subfield_recommended_fertilizer})
        return jsonify({"data": "Successfully update the measurement"}), 200
    else:
        return jsonify({"data": "Failed to update the measurement"}), 500


@api.route("/position/<int:measurement_id>", methods=["PUT"])
@authentication_required
def upgister_measurement_position(user_id, data, measurement_id):
    updated_measurement = update_measurement(user_id, measurement_id, data)
    if updated_measurement is not None:
        publish_event(user_id, "measurement.update_position",
                      {"field_id": updated_measurement["field_id"], "season_id": updated_measurement["season_id"],
                       "measurement": updated_measurement})
        return jsonify({"data": "Successfully update the measurement position"}), 200
    else:
        return jsonify({"data": "Failed to update the measurement position"}), 500
