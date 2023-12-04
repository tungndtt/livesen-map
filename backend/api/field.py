from flask import Blueprint, send_from_directory, jsonify
from services.store.field import get_field, insert_field, delete_field, list_fields, insert_field_ndvi_raster
# from services.raster.extractor import extract_raster
from services.field_operation.field_ndvi import get_field_ndvi
from shapely.geometry import Polygon
from api.authentication import authentication_required
import os
from config import RASTEXTRACTOR


api = Blueprint("field", __name__, url_prefix="/field")


@api.route("/ndvi/<path:filename>", methods=["GET"])
@authentication_required
def retrieve_field_ndvi(_, __, filename):
    return send_from_directory(RASTEXTRACTOR.data_folder, filename)


@api.route("", methods=["GET"])
@authentication_required
def list_all_fields(user_id, _):
    fields = list_fields(user_id)
    if fields is not None:
        return fields, 200
    else:
        return jsonify({"data": "Failed to retrieve fields"}), 500


@api.route("/register", methods=["POST"])
@authentication_required
def register_field(user_id, data):
    name = data["name"]
    coordinates = Polygon(data["coordinates"]).__str__()
    inserted_field = insert_field(user_id, name, coordinates)
    if inserted_field is not None:
        return inserted_field, 201
    else:
        return jsonify({"data": "Failed to register the field"}), 500


@api.route("/unregister/<int:field_id>", methods=["DELETE"])
@authentication_required
def unregister_field(_, __, field_id):
    ndvi_rasters = delete_field(field_id)
    if ndvi_rasters is not None:
        try:
            for ndvi_raster in ndvi_rasters:
                _, tiff_file = ndvi_raster.split("_")
                os.remove(os.path.join(RASTEXTRACTOR.data_folder, tiff_file))
            return jsonify({"data": "Successfully unregister the field"}), 204
        except Exception as error:
            print("[Field API]", error)
    return jsonify({"data": "Failed to unregister the field"}), 500


@api.route("/process_ndvi/<int:field_id>/<period_id>", methods=["GET"])
@authentication_required
def process_field_ndvi(user_id, _, field_id, period_id):
    field = get_field(user_id, field_id)
    if field is None:
        return jsonify({"data": "Cannot find the field"}), 404
    for raster_data in field["ndvi_rasters"]:
        if raster_data.startswith(period_id):
            return jsonify({"data": raster_data}), 200
    tiff_file = get_field_ndvi(field["coordinates"], period_id + ".nc")
    if tiff_file is None:
        return jsonify({"data": "No ndvi-scan of field in given period"}), 404
    else:
        raster_data = period_id + "_" + tiff_file
        success = insert_field_ndvi_raster(field_id, raster_data)
        if success:
            return jsonify({"data": raster_data}), 201
        else:
            return jsonify({"data": "Failed to process field ndvi"}), 500
