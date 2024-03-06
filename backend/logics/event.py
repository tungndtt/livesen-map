from time import sleep
from repos.notify.notifier import publish_event as publish
from repos.notify.notifier import get_channel, ConnectionError
from libs.jwt.token import verify_token
from config import APP


def stream(auth_token: str):
    channel = None
    try:
        user_id = 1 if APP.is_testing else verify_token(auth_token)
        if user_id is not None:
            channel = get_channel(user_id)
            while channel is None:
                channel = get_channel(user_id)
                sleep(2)
            for message in channel.listen():
                if APP.is_testing or verify_token(auth_token) is not None:
                    if message["type"] == "message":
                        yield "data: %s\n\n" % message["data"].decode("utf-8")
                else:
                    break
    except ConnectionError:
        print("[SSE] Redis-server disconnected")
    except:
        print("[SSE] Client disconnected")
    finally:
        if channel is not None:
            channel.close()
