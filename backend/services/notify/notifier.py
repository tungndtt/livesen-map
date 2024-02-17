from datetime import datetime
from json import dumps
import redis
from config import NOTIFIER


__redis = None


def get_channel(channel_id: int | str):
    pubsub = __redis.pubsub()
    pubsub.subscribe(channel_id)
    return pubsub


def __json_serial(obj):
    if isinstance(obj, datetime):
        return obj.strftime("%a, %d %b %Y %H:%M:%S GMT")
    raise TypeError("Type %s not serializable" % type(obj))


def publish_event(channel_id: int, type: str, payload):
    event = dumps({"type": type, "payload": payload}, default=__json_serial)
    __redis.publish(channel_id, event)


def init():
    global __redis
    if __redis is None:
        __redis = redis.Redis(host=NOTIFIER.host, port=NOTIFIER.port,
                              health_check_interval=60)


def term():
    global __redis
    if __redis is not None:
        __redis.close()
