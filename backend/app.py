from flask import Flask
from flask_cors import CORS
from api import authentication, metadata, user, field, season, ndvi_raster, measurement
from services.download import downloader
from services.store import storage
from services.mail import mailer
from services.recommend import recommender
from config import APP


if __name__ == "__main__":
    try:
        downloader.init()
        storage.init()
        mailer.init()
        recommender.init()
        app = Flask(__name__)
        CORS(app)
        app.register_blueprint(authentication.api)
        app.register_blueprint(metadata.api)
        app.register_blueprint(user.api)
        app.register_blueprint(field.api)
        app.register_blueprint(season.api)
        app.register_blueprint(ndvi_raster.api)
        app.register_blueprint(measurement.api)
        app.run(host=APP.host, port=APP.port, threaded=True)
    except Exception as error:
        print("[App]", error)
    finally:
        downloader.term()
        storage.term()
        mailer.term()
        recommender.term()
