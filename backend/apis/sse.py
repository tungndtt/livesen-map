from flask import Blueprint, Response, request, stream_with_context
from logics.event import stream


api = Blueprint("sse", __name__, url_prefix="/sse")


@api.route("")
def stream_events():
    auth_token = request.args.get("auth_token")
    return Response(stream_with_context(stream(auth_token)),
                    headers={"Content-Type": "text/event-stream",
                             "Cache-Control": "no-cache",
                             "X-Accel-Buffering": "no"})
