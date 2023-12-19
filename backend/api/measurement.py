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


@api.route("/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def list_all_measurements(user_id, _, field_id, season_id):
    measurements = list_measurements(user_id, field_id, season_id)
    if measurements is not None and len(measurements) > 0:
        return measurements, 200
    else:
        return jsonify({"data": "Failed to retrieve measurements within given period"}), 500


@api.route("/subfield/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def list_all_subfields(user_id, _, field_id, season_id):
    subfields = list_subfields(user_id, field_id, season_id)
    if subfields is not None and len(subfields) > 0:
        return subfields, 200
    else:
        return jsonify({"data": "Failed to retrieve all subfields"}), 500


@api.route("/determine_positions/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def determine_measurement_positions(user_id, _, field_id, season_id):
    field = get_field(user_id, field_id)
    if field is None:
        return jsonify({"data": "Cannot find the field"}), 404
    coordinates = field["coordinates"]
    ndvi_rasters = field["ndvi_rasters"]
    ndvi_raster = None
    if season_id in ndvi_rasters:
        ndvi_raster = ndvi_rasters[season_id]
    if ndvi_raster is None:
        ndvi_raster = get_field_ndvi(coordinates, season_id + ".nc")
        if ndvi_raster is None:
            return jsonify({"data": "No ndvi-scan of field in given period"}), 500
        elif not insert_field_ndvi_raster(field_id, season_id, ndvi_raster):
            return jsonify({"data": "Failed to process field ndvi"}), 500
    subfield_groups = get_subfields_pixel_based_split(ndvi_raster)
    # subfield_groups = get_subfields_region_based_split(coordinates, tiff_file)
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
                "ndvi": closest_ndvi
            }
            inserted_measurement = insert_measurement(
                cursor, user_id, field_id, season_id, data)
            if inserted_measurement is not None:
                inserted_measurements.append(inserted_measurement)
                for subfield, ndvi in subfield_ndvis:
                    inserted_subfields.append(
                        insert_subfield(cursor, user_id, field_id, season_id,
                                        inserted_measurement["id"], subfield.__str__(), ndvi)
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
