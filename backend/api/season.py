from flask import Blueprint, jsonify
from services.store.season import list_seasons, upsert_season, delete_season
from api.authentication import authentication_required


api = Blueprint("season", __name__, url_prefix="/season")


@api.route("/<field_id>/<period_id>", methods=["GET"])
@authentication_required
def list_all_seasons(user_id, _, field_id, period_id):
    seasons = list_seasons(user_id, field_id, period_id)
    if seasons is not None:
        return seasons, 200
    else:
        return jsonify({"data": "Failed to retrieve the seasons"}), 500


@api.route("/upregister", methods=["POST"])
@authentication_required
def upregister_season(user_id, data):
    upserted_season = upsert_season(user_id, data)
    if upserted_season is not None:
        return upserted_season, 201
    else:
        return jsonify({"data": "Failed to upregister the season"}), 500


@api.route("/unregister/<field_id>/<period_id>", methods=["DELETE"])
@authentication_required
def unregister_season(user_id, _, field_id, period_id):
    if delete_season(user_id, field_id, period_id):
        return jsonify({"data": "Successfully unregister the season"}), 204
    else:
        return jsonify({"data": "Failed to unregister the season"}), 500
