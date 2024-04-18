from flask import Flask
from apis import authentication, metadata, user, field, season, measurement, sse
from repos.store import storage
from repos.mail import mailer
from repos.recommend import recommender
from repos.notify import notifier
from config import APP


if __name__ == "__main__":
    try:
        storage.init()
        mailer.init()
        recommender.init()
        notifier.init()
        app = Flask(__name__)
        app.register_blueprint(authentication.api)
        app.register_blueprint(metadata.api)
        app.register_blueprint(user.api)
        app.register_blueprint(field.api)
        app.register_blueprint(season.api)
        app.register_blueprint(measurement.api)
        app.register_blueprint(sse.api)
        app.run(host=APP.host, port=APP.port, threaded=True)
    except Exception as error:
        print("[App]", error)
    finally:
        storage.term()
        mailer.term()
        recommender.term()
        notifier.term()
