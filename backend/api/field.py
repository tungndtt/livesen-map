from flask import Blueprint, request, send_from_directory, jsonify
from services.store.field import get_field, insert_field, delete_field, list_fields, insert_field_ndvi_raster
from services.raster.extractor import extract_raster
from api.authentication import authentication_required
import os
from config import RASTEXTRACTOR, DOWNLOADER


api = Blueprint("field", __name__, url_prefix="/field")


@api.route("/ndvi/<path:filename>", methods=["GET"])
@authentication_required
def get_field_ndvi(_, __, filename):
    return send_from_directory(RASTEXTRACTOR.data_folder, filename)


@api.route("/", methods=["GET"])
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
    coordinates = data["coordinates"]
    inserted_field = insert_field(user_id, name, coordinates)
    if inserted_field is not None:
        return inserted_field, 201
    else:
        return jsonify({"data": "Failed to register the field"}), 500


@api.route("/unregister/<field_id>", methods=["DELETE"])
@authentication_required
def unregister_field(_, __, field_id):
    ndvi_rasters = delete_field(field_id)
    if ndvi_rasters is not None:
        try:
            for ndvi_raster in ndvi_rasters:
                os.remove(os.path.join(RASTEXTRACTOR.data_folder, ndvi_raster))
            return jsonify({"data": "Successfully unregister the field"}), 204
        except Exception as error:
            print("[Field API]", error)
    return jsonify({"data": "Failed to unregister the field"}), 500


@api.route("/process_ndvi/<field_id>", methods=["GET"])
@authentication_required
def process_field_ndvi(user_id, _, field_id):
    field = get_field(user_id, field_id)
    if field is None:
        return jsonify({"data": "Cannot find the field"}), 404
    period = request.args.get("period")
    nc_file = os.path.join(DOWNLOADER.data_folder, period + ".nc")
    tiff_file = extract_raster(field["coordinates"], nc_file)
    if tiff_file is None:
        return jsonify({"data": "No ndvi-scan of field in given period"}), 500
    else:
        raster_data = period + "_" + tiff_file
        success = insert_field_ndvi_raster(field_id, raster_data)
        if success:
            return jsonify({"data": raster_data}), 201
        else:
            return jsonify({"data": "Failed to process field ndvi"}), 500
