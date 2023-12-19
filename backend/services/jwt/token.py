import jwt
import datetime
from config import JWTOKEN
from typing import Any


__algorithm = "HS256"


def generate_token(data: Any, duration: float) -> str:
    payload = {
        "data": data,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=duration),
    }
    return jwt.encode(payload, JWTOKEN.secret, algorithm=__algorithm)


def verify_token(token: str) -> Any | None:
    try:
        payload = jwt.decode(token, JWTOKEN.secret,
                             algorithms=[__algorithm])
        return payload["data"]
    except jwt.InvalidTokenError:
        return None


if __name__ == "__main__":
    import time
    duration = 0.025
    data = 0
    token = generate_token(data, duration)
    print(token)
    print(verify_token(token))
    time.sleep(2)
    print(verify_token(token))
