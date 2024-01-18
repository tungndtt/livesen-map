from flask import Flask
from flask_cors import CORS
import incremental_train
import model
from config import APP


if __name__ == "__main__":
    try:
        app = Flask(__name__)
        CORS(app)
        incremental_train.init()
        model.init()
        app.run(host=APP.host, port=APP.port)
    except Exception as error:
        print("[App]", error)
