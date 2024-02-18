import time
from flask import Blueprint, Response, request, stream_with_context
from services.notify.notifier import get_channel, ConnectionError
from libs.jwt.token import verify_token
from config import APP


api = Blueprint("sse", __name__, url_prefix="/sse")


def stream(auth_token: str):
    channel = None
    try:
        user_id = 1 if APP.is_testing else verify_token(auth_token)
        if user_id is not None:
            channel = get_channel(user_id)
            while channel is None:
                channel = get_channel(user_id)
                time.sleep(2)
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


@api.route("")
def stream_events():
    auth_token = request.args.get("auth_token")
    return Response(stream_with_context(stream(auth_token)),
                    headers={"Content-Type": "text/event-stream",
                             "Cache-Control": "no-cache",
                             "X-Accel-Buffering": "no"})
