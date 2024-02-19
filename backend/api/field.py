import os
from flask import Blueprint, jsonify
from shapely.geometry import Polygon
from api.authentication import authentication_required
from services.store.dafs.field import get_field, insert_field, delete_field, list_fields_info
from services.store.dafs.ndvi_raster import list_ndvi_rasters
from services.notify.notifier import publish_event
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
    if (
        "name" not in data or not data["name"] or
        "coordinates" not in data or not data["coordinates"]
    ):
        return jsonify({"data": "Cannot register the field without 'name' or 'coordinates'"}), 500
    try:
        name = data["name"]
        coordinates = data["coordinates"]
        shell = coordinates[0]
        holes = coordinates[1:]
        region = Polygon(shell, holes).__str__()
        inserted_field = insert_field(user_id, name, region)
        if inserted_field is not None:
            if publish_event(user_id, "field.create", inserted_field):
                return jsonify({"data": "Successfully register the field"}), 201
            else:
                return jsonify({"data": "Successfully register the field but failed to publish sync event"}), 500
        else:
            return jsonify({"data": "Failed to register the field"}), 500
    except:
        return jsonify({"data": "Registered field must be polygon and its coordinates must follow GeoJSON format"}), 500


@api.route("/unregister/<int:field_id>", methods=["DELETE"])
@authentication_required
def unregister_field(user_id, __, field_id):
    ndvi_rasters = list_ndvi_rasters(user_id, field_id)
    if delete_field(user_id, field_id):
        if ndvi_rasters is not None:
            try:
                for ndvi_raster in ndvi_rasters.values():
                    os.remove(os.path.join(NDVI.data_folder, ndvi_raster))
            except Exception as error:
                print("[Field API]", error)
        if publish_event(user_id, "field.delete", {"id": field_id}):
            return jsonify({"data": "Successfully unregister the field"}), 204
        else:
            return jsonify({"data": "Successfully unregister the field but failed to publish sync event"}), 500
    else:
        return jsonify({"data": "Failed to unregister the field"}), 500
