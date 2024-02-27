from uuid import uuid4
from flask import Blueprint, request, jsonify
from services.store.dafs.user import get_user, insert_user, update_user
from services.mail.mailer import send_email
from libs.jwt.token import generate_token, verify_token
from libs.hash.hasher import encrypt, check
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
    user = get_user(email=email)
    if user is None:
        return jsonify({"data": "Given email does not exist"}), 404
    else:
        if check(password, user["password"]):
            return jsonify({"data": generate_token(user["id"], 2*60)}), 200
        else:
            return jsonify({"data": "Given email/password is invalid"}), 401


@api.route("/sign_up", methods=["POST"])
def sign_up():
    data = request.get_json()
    if "email" not in data or not data["email"]:
        return jsonify({"data": "No 'email' found"}), 401
    if "password" not in data or not data["password"]:
        return jsonify({"data": "No 'password' found"}), 401
    email, password = data["email"], data["password"]
    record = get_user(email=email)
    if record is None:
        encrypted_password = encrypt(password)
        data["password"] = encrypted_password
        duration = 10
        verification_token = generate_token(data, duration)
        subject = "Livesen Registration"
        content = f"""
        <html>
            <body>
                <p>
                    Dear user,
                    <br><br>
                    welcome to Livesen-Map platform. In order to activate your account, please paste the following verification token in the registration form:
                    <br><br>
                    <b>{verification_token}</b>
                    <br><br>
                    Note that the token is only valid in {duration} minutes since this email is released!
                    <br><br>
                    Best,
                    <br>
                    Livesen Team
                </p>
            </body>
        </html>
        """
        success = send_email(email, subject, content)
        if success:
            return jsonify({"data": "Successfully send the activation email"}), 202
        else:
            return jsonify({"data": "Cannot send the activation email"}), 500
    else:
        return jsonify({"data": "Registered email already existed"}), 406


@api.route("/reset_password", methods=["POST"])
def reset_password():
    data = request.get_json()
    if "email" not in data or not data["email"]:
        return jsonify({"data": "No 'email' found"}), 401
    if "password" not in data or not data["password"]:
        return jsonify({"data": "No 'password' found"}), 401
    email, password = data["email"], data["password"]
    record = get_user(email=email)
    if record is not None:
        encrypted_password = encrypt(password)
        data["password"] = encrypted_password
        duration = 10
        verification_token = generate_token(data, duration)
        subject = "Livesen Reset Password"
        content = f"""
        <html>
            <body>
                <p>
                    Dear user,
                    <br><br>
                    in order to activate your account, please paste the following verification token in the reset form:
                    <br><br>
                    <b>{verification_token}</b>
                    <br><br>
                    Note that the token is only valid in {duration} minutes since this email is released!
                    <br><br>
                    Best,
                    <br>
                    Livesen Team
                </p>
            </body>
        </html>
        """
        success = send_email(email, subject, content)
        if success:
            return jsonify({"data": "Successfully send the reset-password email"}), 202
        else:
            return jsonify({"data": "Cannot send the reset-password email"}), 500
    else:
        return jsonify({"data": "Given email does not exist"}), 406


@api.route("/verification", methods=["POST"])
def verify():
    if request.is_json:
        data = request.get_json()
    if "verification_token" not in data or not data["verification_token"]:
        return jsonify({"data": "No 'verification_token' found"}), 401
    verification_token = data["verification_token"]
    data = verify_token(verification_token)
    if data is None:
        return jsonify({"data": "Verification token is invalid"}), 401
    else:
        if "type" not in data:
            return jsonify({"data": "No 'type' defined for the verification request"}), 401
        verification_type = data["type"]
        if verification_type == "sign_up":
            return __activate_registration(data)
        elif verification_type == "reset_password":
            return __reset_password(data)
        else:
            return jsonify({"data": f"Unsupport verification request of type '{verification_type}'"}), 406


def __activate_registration(data):
    email = data["email"]
    if get_user(email=email) is None:
        if insert_user(data):
            return jsonify({"data": "Account is successfully activated"}), 201
        else:
            return jsonify({"data": "Cannot register the account"}), 500
    else:
        return jsonify({"data": "Account was already registered"}), 409


def __reset_password(data):
    email = data["email"]
    if get_user(email=email) is not None:
        if update_user(data):
            return jsonify({"data": "Successfully reset password"}), 201
        else:
            return jsonify({"data": "Cannot reset the password"}), 500
    else:
        return jsonify({"data": "Account does not exist"}), 404
