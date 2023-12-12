from flask import Blueprint, jsonify
from api.authentication import authentication_required
from services.store.storage import DbCursor
from services.store.field import get_field, insert_field_ndvi_raster
from services.store.measurement import list_measurements, insert_measurement, update_measurement
from services.store.subfield import list_subfields, insert_subfield
from services.field_operation.field_ndvi import get_field_ndvi
from services.field_operation.subfield_split import get_subfields_region_based_split, get_subfields_pixel_based_split
from services.field_operation.measurement_position import find_measurement_position


api = Blueprint("measurement", __name__, url_prefix="/measurement")


@api.route("/<int:field_id>/<period_id>", methods=["GET"])
@authentication_required
def list_all_measurements(user_id, _, field_id, period_id):
    measurements = list_measurements(user_id, field_id, period_id)
    if measurements is not None and len(measurements) > 0:
        return measurements, 200
    else:
        return jsonify({"data": "Failed to retrieve measurements within given period"}), 500


@api.route("/subfield/<int:field_id>/<period_id>", methods=["GET"])
@authentication_required
def list_all_subfields(user_id, _, field_id, period_id):
    subfields = list_subfields(user_id, field_id, period_id)
    if subfields is not None and len(subfields) > 0:
        return subfields, 200
    else:
        return jsonify({"data": "Failed to retrieve all subfields"}), 500


@api.route("/determine_positions/<int:field_id>/<period_id>", methods=["GET"])
@authentication_required
def determine_measurement_positions(user_id, _, field_id, period_id):
    field = get_field(user_id, field_id)
    if field is None:
        return jsonify({"data": "Cannot find the field"}), 404
    coordinates = field["coordinates"]
    tiff_file = None
    for ndvi_raster in field["ndvi_rasters"]:
        if ndvi_raster.startswith(period_id):
            tiff_file = ndvi_raster[len(period_id) + 1:]
            break
    if tiff_file is None:
        tiff_file = get_field_ndvi(coordinates, period_id + ".nc")
        if tiff_file is None:
            return jsonify({"data": "No ndvi-scan of field in given period"}), 500
        elif not insert_field_ndvi_raster(field_id, period_id + "_" + tiff_file):
            return jsonify({"data": "Failed to process field ndvi"}), 500
    subfield_groups = get_subfields_pixel_based_split(tiff_file)
    # subfield_groups = get_subfields_region_based_split(coordinates, tiff_file)
    measurement_positions = []
    for subfield_ndvis in subfield_groups:
        for subfield, ndvi in subfield_ndvis:
            measurement_positions.append(
                (find_measurement_position(subfield), ndvi)
            )
    db_cursor = DbCursor()
    inserted_subfields, inserted_measurements = [], []
    with db_cursor as cursor:
        for subfield_ndvis in subfield_groups:
            for subfield, _ in subfield_ndvis:
                inserted_subfields.append(
                    insert_subfield(cursor, user_id, field_id,
                                    period_id, subfield.__str__())
                )
        for i, (measurement_position, ndvi) in enumerate(measurement_positions):
            data = {
                "longitude": measurement_position.x,
                "latitude": measurement_position.y,
                "ndvi_value": ndvi
            }
            inserted_measurements.append(
                insert_measurement(cursor, user_id, field_id, period_id, inserted_subfields[i]["id"],
                                   data)
            )
    if db_cursor.error is None:
        return jsonify({"measurements": inserted_measurements, "subfields": inserted_subfields}), 201
    else:
        return jsonify({"data": "Failed to determine the measurement positions"}), 500


@api.route("/upgister/<int:measurement_id>", methods=["PUT"])
@authentication_required
def upgister_measurement(user_id, data, measurement_id):
    updated_measurement = update_measurement(user_id, measurement_id, data)
    if updated_measurement is not None:
        return updated_measurement, 200
    else:
        return jsonify({"data": "Failed to update the measurement"}), 500
