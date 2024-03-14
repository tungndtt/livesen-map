from datetime import datetime, date
from json import dumps
from redis import Redis
from redis.client import PubSub
from redis.exceptions import ConnectionError
from config import NOTIFIER


__redis = None


def get_channel(channel_id: int | str) -> PubSub | None:
    try:
        pubsub = __redis.pubsub()
        pubsub.subscribe(channel_id)
        return pubsub
    except:
        return None


def __json_serial(obj):
    if isinstance(obj, (datetime, date)):
        return obj.strftime("%a, %d %b %Y %H:%M:%S GMT")
    raise TypeError("Type %s not serializable" % type(obj))


def publish_event(channel_id: int, type: str, payload) -> bool:
    event = dumps({"type": type, "payload": payload}, default=__json_serial)
    try:
        __redis.publish(channel_id, event)
        return True
    except:
        return False


def init():
    global __redis
    if __redis is None:
        __redis = Redis(host=NOTIFIER.host, port=NOTIFIER.port,
                        health_check_interval=60)


def term():
    global __redis
    if __redis is not None:
        __redis.close()
