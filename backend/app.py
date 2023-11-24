from flask import Flask
from flask_cors import CORS
from api import authentication, field, season, subfield, measurement, period
from services.download import downloader
from services.store import storage
from services.mail import mailer
from config import APP


if __name__ == "__main__":
    try:
        # downloader.init()
        storage.init()
        mailer.init()
        app = Flask(__name__)
        CORS(app)
        app.register_blueprint(authentication.api)
        app.register_blueprint(field.api)
        app.register_blueprint(season.api)
        app.register_blueprint(subfield.api)
        app.register_blueprint(measurement.api)
        app.register_blueprint(period.api)
        app.run(host=APP.host, port=APP.port)
    except Exception as error:
        print("[App]", error)
