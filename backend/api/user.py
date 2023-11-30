from flask import Blueprint, jsonify
from services.store.user import get_user, update_user
from api.authentication import authentication_required
from services.hash.hasher import encrypt

api = Blueprint("user", __name__, url_prefix="/user")


@api.route("", methods=["GET"])
@authentication_required
def retrieve_user(user_id, _):
    user = get_user(user_id)
    if user is not None:
        del user["password"]
        return user, 200
    else:
        return jsonify({"data": "Cannot retrieve the user"}), 406


@api.route("/upgister", methods=["PUT"])
@authentication_required
def upgister_user(user_id, data):
    if "password" in data and data["password"]:
        data["password"] = encrypt(data["password"])
    updated_user = update_user(user_id, data)
    if updated_user is not None:
        del updated_user["password"]
        return updated_user, 200
    else:
        return jsonify({"data": "Cannot update the user information"}), 406
