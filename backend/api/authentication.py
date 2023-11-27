from flask import Blueprint, request, jsonify
from services.store.user import get_user, insert_user
from services.jwt.token import generate_token, verify_token
from services.hash.hasher import encrypt, check
from services.mail.mailer import send_email
from config import APP


def authentication_required(f):
    def decorator(*args, **kwargs):
        data = None
        if request.is_json:
            data = request.get_json()
        if APP.dev_mode:
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
    data = request.json()
    email, password = data["email"], data["password"]
    user = get_user(email)
    if user is None:
        return jsonify({"data": "Given email does not exist"}), 404
    else:
        if check(password, user["password"]):
            return jsonify({"data": generate_token(user["id"], 2*60)}), 200
        else:
            return jsonify({"data": "Given email/password is invalid"}), 401


@api.route("/sign_up", methods=["POST"])
def sign_up():
    data = request.json()
    email, password = data["email"], data["password"]
    record = get_user(email)
    if record is None:
        encrypted_password = encrypt(password)
        data = {"email": email, "password": encrypted_password}
        duration = 10
        registration_token = generate_token(data, duration)
        registration_link = f"{APP.host}:{APP.port}/register?registration_token={registration_token}"
        subject = "Livesen Registration"
        content = f"""
        <html>
            <body>
                <p>
                    Dear user,
                    <br><br>
                    welcome to Livesen-Map platform. In order to activate your account registration, please click on this <a href="{registration_link}">link</a>.
                    <br>
                    Note that the link is only valid in {duration} minutes since this email is released!
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
            return jsonify({"data": "Successfully send the registration email"}), 202
        else:
            return jsonify({"data": "Cannot send the activation email"}), 500
    else:
        return jsonify({"data": "Registered email already existed"}), 406


@api.route("/register", methods=["GET"])
def register():
    registration_token = request.args.get("registration_token")
    data = verify_token(registration_token)
    if data is None:
        return jsonify({"data": "Registration token is invalid"}), 408
    else:
        email, password = data["email"], data["password"]
        if get_user(email) is None:
            if insert_user(email, password):
                return jsonify({"data": "Registration is successful"}), 201
            else:
                return jsonify({"data": "Cannot register user"}), 406
        else:
            return jsonify({"data": "User was already registered"}), 406
