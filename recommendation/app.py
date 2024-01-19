from flask import Flask, request, jsonify
from flask_cors import CORS
import incremental_train
import model
from config import APP


app = Flask(__name__)
CORS(app)


@app.route("/", methods=["POST"])
def recommendation():
    data = request.get_json()
    recommendation = model.recommend(data)
    if recommendation is not None:
        return jsonify({"data": recommendation}), 200
    else:
        return jsonify({"data": "Cannot provide recomendation from the given data"}), 404


if __name__ == "__main__":
    try:
        incremental_train.init()
        app.run(host=APP.host, port=APP.port)
    except Exception as error:
        print("[App]", error)
