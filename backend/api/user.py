from flask import Blueprint, jsonify
from api.authentication import authentication_required
from services.store.dafs.user import get_user, update_user
from services.notify.notifier import publish_event
from libs.hash.hasher import encrypt

api = Blueprint("user", __name__, url_prefix="/user")


@api.route("", methods=["GET"])
@authentication_required
def retrieve_user(user_id, _):
    user = get_user(user_id=user_id)
    if user is not None:
        del user["password"]
        return user, 200
    else:
        return jsonify({"data": "Cannot retrieve the user"}), 404


@api.route("/upgister", methods=["PUT"])
@authentication_required
def upgister_user(user_id, data):
    if "password" in data and data["password"]:
        data["password"] = encrypt(data["password"])
    updated_user = update_user(user_id, data)
    if updated_user is not None:
        del updated_user["password"]
        if publish_event(user_id, "user.update", updated_user):
            return jsonify({"data": "Successfully update the user information"}), 200
        else:
            return jsonify({"data": "Successfully update the user information but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Cannot update the user information"}), 500
