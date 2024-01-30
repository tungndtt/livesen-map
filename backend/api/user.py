from flask import Blueprint, request, jsonify
from api.authentication import authentication_required
from services.store.dafs.user import get_user, update_user, insert_user
from utils.jwt.token import verify_token
from utils.hash.hasher import encrypt

api = Blueprint("user", __name__, url_prefix="/user")


@api.route("", methods=["GET"])
@authentication_required
def retrieve_user(user_id, _):
    user = get_user(user_id=user_id)
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


@api.route("/register", methods=["GET"])
def register():
    registration_token = request.args.get("registration_token")
    data = verify_token(registration_token)
    if data is None:
        return jsonify({"data": "Registration token is invalid"}), 408
    else:
        email = data["email"]
        if get_user(email=email) is None:
            if insert_user(data):
                return jsonify({"data": "Registration is successful"}), 201
            else:
                return jsonify({"data": "Cannot register user"}), 406
        else:
            return jsonify({"data": "User was already registered"}), 406
