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


class Worker(GeventWorker):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        storage.init()
        mailer.init()
        recommender.init()
        notifier.init()

    def run(self):
        super().run()

    def __exit__(self, exc_type, exc_val, exc_tb):
        storage.term()
        mailer.term()
        recommender.term()
        notifier.term()
        super().__exit__(exc_type, exc_val, exc_tb)


# Gunicorn settings
bind = f"{APP.host}:{APP.port}"
workers = 2
threads = 5
worker_class = "gunicorn_config.Worker"
