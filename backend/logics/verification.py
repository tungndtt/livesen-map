from repos.mail.mailer import send_email
from libs.jwt.token import generate_token
from libs.hash.hasher import encrypt, check
from logics.user import get_user, add_user, modify_user


def check_password(email: str, password: str) -> str | None:
    user = get_user(email=email)
    if user is None:
        return None
    else:
        if check(password, user["password"]):
            return generate_token(user["id"], 2*60)
        else:
            return None


def send_registration_email(email: str, password: str, data: dict | None) -> bool:
    user = get_user(email=email)
    if user is None:
        if data is None:
            data = {}
        data["email"] = email
        data["password"] = encrypt(password)
        duration = 10
        verification_token = generate_token(data, 10)
        content = f"""
        <html>
            <body>
                <p>
                    Dear user,
                    <br><br>
                    welcome to Livesen-Map.
                    <br>
                    In order to complete your action, please paste the following token in the registration verification form:
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
        return send_email(email, "Livesen Registration", content)
    else:
        return False


def send_password_reset_email(email: str, password: str) -> bool:
    user = get_user(email=email)
    if user is not None:
        data = {"email": email, "password": encrypt(password)}
        duration = 10
        verification_token = generate_token(data, 10)
        content = f"""
        <html>
            <body>
                <p>
                    Dear user,
                    <br><br>
                    you receive this email because you want to reset your password.
                    <br>
                    In order to confirm your action, please paste the following token in the password reset verification form:
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
        return send_email(email, "Livesen Reset Password", content)
    else:
        return False


def activate_registration(data):
    email = data["email"]
    if get_user(email=email) is None:
        return add_user(data)
    return None


def activate_password_reset(data):
    email = data["email"]
    if (user := get_user(email=email)) is not None:
        return modify_user(user["id"], data)
    return None
