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


def send_registration_email(email: str, password: str) -> bool:
    return __send_verification_email(
        email, password,
        "Livesen Registration",
        "welcome to Livesen-Map - a platform supports efficient agricultural farming"
    )


def send_reset_password_email(email: str, password: str) -> bool:
    return __send_verification_email(
        email, password,
        "Livesen Reset Password",
        "you receive this email because you want to reset your password"
    )


def __send_verification_email(email: str, password: str, subject: str, body: str):
    user = get_user(email=email)
    if user is not None:
        data = {"password": encrypt(password)}
        duration = 10
        verification_token = generate_token(data, 10)
        content = f"""
        <html>
            <body>
                <p>
                    Dear user,
                    <br><br>
                    {body}.
                    <br>
                    In order to complete your action, please paste the following token in the verification form:
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
        return send_email(email, subject, content)
    else:
        return False


def activate_registration(data):
    email = data["email"]
    if get_user(email=email) is None:
        return add_user(data)
    return False


def reset_password(data):
    email = data["email"]
    if get_user(email=email) is not None:
        return modify_user(data)
    return False
