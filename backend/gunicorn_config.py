from gunicorn.workers.ggevent import GeventWorker
from services.download import downloader
from services.store import storage
from services.mail import mailer
from services.recommend import recommender
from services.notify import notifier
from config import APP


def on_starting(_):
    downloader.init()


def on_exit(_):
    downloader.term()


def worker_exit(_, __):
    storage.term()
    mailer.term()
    recommender.term()
    notifier.term()


class Worker(GeventWorker):
    def __init__(self, *args, **kwargs):
        storage.init()
        mailer.init()
        recommender.init()
        notifier.init()
        super().__init__(*args, **kwargs)

    def run(self):
        super().run()


# Gunicorn settings
bind = f"{APP.host}:{APP.port}"
workers = 3
threads = 8
worker_class = "gunicorn_config.Worker"
