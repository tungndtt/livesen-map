from flask import Blueprint, jsonify
from services.store.field import get_field, insert_field, delete_field, list_fields_info
from services.store.ndvi_raster import list_ndvi_rasters
from shapely.geometry import Polygon
from api.authentication import authentication_required
import os
from config import NDVI


api = Blueprint("field", __name__, url_prefix="/field")


@api.route("", methods=["GET"])
@authentication_required
def retrieve_field_options(user_id, _):
    field_options = list_fields_info(user_id)
    if field_options is not None:
        return field_options, 200
    else:
        return jsonify({"data": "Failed to retrieve field ids"}), 500


@api.route("/<int:field_id>", methods=["GET"])
@authentication_required
def retrieve_field(user_id, _, field_id):
    field = get_field(user_id, field_id)
    if field is not None:
        return field, 200
    else:
        return jsonify({"data": "Failed to retrieve field"}), 500


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
def unregister_field(user_id, __, field_id):
    ndvi_rasters = list_ndvi_rasters(user_id, field_id)
    if ndvi_rasters is not None and delete_field(user_id, field_id):
        try:
            for ndvi_raster in ndvi_rasters.values():
                os.remove(os.path.join(NDVI.data_folder, ndvi_raster))
            return jsonify({"data": "Successfully unregister the field"}), 204
        except Exception as error:
            print("[Field API]", error)
    return jsonify({"data": "Failed to unregister the field"}), 500
