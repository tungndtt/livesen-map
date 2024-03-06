from flask import Blueprint, jsonify
from apis.authentication import authentication_required
from logics.field import get_field_options, get_field, add_field, remove_field
from logics.event import publish


api = Blueprint("field", __name__, url_prefix="/field")


@api.route("", methods=["GET"])
@authentication_required
def retrieve_field_options(user_id, _):
    field_options = get_field_options(user_id)
    if field_options is not None:
        return field_options, 200
    else:
        return jsonify({"data": "Failed to retrieve field ids"}), 404


@api.route("/<int:field_id>", methods=["GET"])
@authentication_required
def retrieve_field(user_id, _, field_id):
    field = get_field(user_id, field_id)
    if field is not None:
        return field, 200
    else:
        return jsonify({"data": "Failed to retrieve field"}), 404


@api.route("/register", methods=["POST"])
@authentication_required
def register_field(user_id, data):
    if (
        "name" not in data or not data["name"] or
        "coordinates" not in data or not data["coordinates"]
    ):
        return jsonify({"data": "Cannot register the field without 'name' or 'coordinates'"}), 406
    try:
        name = data["name"]
        coordinates = data["coordinates"]
        inserted_field = add_field(user_id, name, coordinates)
        if inserted_field is not None:
            if publish(user_id, "field.create", inserted_field):
                return jsonify({"data": "Successfully register the field"}), 201
            else:
                return jsonify({"data": "Successfully register the field but failed to publish sync event"}), 503
        else:
            return jsonify({"data": "Failed to register the field"}), 500
    except:
        return jsonify({"data": "Registered field must be polygon and its coordinates must follow GeoJSON format"}), 406


@api.route("/unregister/<int:field_id>", methods=["DELETE"])
@authentication_required
def unregister_field(user_id, _, field_id):
    if remove_field(user_id, field_id):
        if publish(user_id, "field.delete", {"id": field_id}):
            return jsonify({"data": "Successfully unregister the field"}), 204
        else:
            return jsonify({"data": "Successfully unregister the field but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to unregister the field"}), 500
