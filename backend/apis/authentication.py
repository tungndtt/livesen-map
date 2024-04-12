from flask import Blueprint, request, jsonify
from logics.verification import check_password, send_registration_email, send_password_reset_email, activate_registration, activate_password_reset
from libs.jwt.token import generate_token, verify_token
from config import APP


def authentication_required(f):
    def decorator(*args, **kwargs):
        data = None
        if request.is_json:
            data = request.get_json()
        if APP.is_testing:
            return f(1, data, *args, **kwargs)
        auth_token = request.headers.get("Auth-Token", "")
        user_id = verify_token(auth_token)
        if user_id is None:
            return jsonify({"data": "Unauthorized"}), 401
        else:
            return f(user_id, data, *args, **kwargs)
    decorator.__name__ = f.__name__
    return decorator


api = Blueprint("authentication", __name__, url_prefix="/authentication")


@api.route("/sign_in", methods=["POST"])
def sign_in():
    data = request.get_json()
    email, password = data["email"], data["password"]
    auth_token = check_password(email, password)
    if auth_token is None:
        return jsonify({"data": "Cannot sign in with given credentials"}), 404
    else:
        return jsonify({"data": auth_token}), 200


@api.route("/sign_up", methods=["POST"])
def sign_up():
    data = request.get_json()
    if "email" not in data or not data["email"]:
        return jsonify({"data": "No 'email' found"}), 401
    if "password" not in data or not data["password"]:
        return jsonify({"data": "No 'password' found"}), 401
    email, password = data["email"], data["password"]
    if send_registration_email(email, password, data):
        return jsonify({"data": "Successfully send the activation email"}), 202
    else:
        return jsonify({"data": "Cannot send the activation email"}), 500


@api.route("/reset_password", methods=["POST"])
def reset_password():
    data = request.get_json()
    if "email" not in data or not data["email"]:
        return jsonify({"data": "No 'email' found"}), 401
    if "password" not in data or not data["password"]:
        return jsonify({"data": "No 'password' found"}), 401
    email, password = data["email"], data["password"]
    email, password = data["email"], data["password"]
    if send_password_reset_email(email, password):
        return jsonify({"data": "Successfully send the reset-password email"}), 202
    else:
        return jsonify({"data": "Cannot send the reset-password email"}), 500


@api.route("/verification", methods=["POST"])
def verify():
    if request.is_json:
        data = request.get_json()
    if "verification_token" not in data or not data["verification_token"]:
        return jsonify({"data": "No 'verification_token' found"}), 401
    if "type" not in data:
        return jsonify({"data": "No 'type' defined for the verification request"}), 401
    verification_type = data["type"]
    verification_token = data["verification_token"]
    content = verify_token(verification_token)
    if data is None:
        return jsonify({"data": "Verification token is invalid"}), 401
    else:
        if verification_type == "sign_up":
            return __activate_registration(content)
        elif verification_type == "reset_password":
            return __reset_password(content)
        else:
            return jsonify({"data": f"Unsupport verification request of type '{verification_type}'"}), 406


def __activate_registration(data):
    if activate_registration(data) is not None:
        return jsonify({"data": "Account is successfully activated"}), 201
    else:
        return jsonify({"data": "Cannot register the account"}), 500


def __reset_password(data):
    if activate_password_reset(data) is not None:
        return jsonify({"data": "Successfully reset password"}), 201
    else:
        return jsonify({"data": "Cannot reset the password"}), 500
