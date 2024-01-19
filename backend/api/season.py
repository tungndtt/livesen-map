from flask import Blueprint, jsonify
from services.store.season import get_season, list_season_ids, insert_season, update_season, delete_season
from services.store.ndvi_raster import get_ndvi_raster
from api.authentication import authentication_required
from config import NDVI, RECOMMENDATION
import os
import requests


api = Blueprint("season", __name__, url_prefix="/season")


@api.route("/<int:field_id>", methods=["GET"])
@authentication_required
def retrieve_season_options(user_id, _, field_id):
    season_ids = list_season_ids(user_id, field_id)
    if season_ids is not None:
        return season_ids, 200
    else:
        return jsonify({"data": "Failed to retrieve the season options"}), 500


@api.route("/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_season(user_id, _, field_id, season_id):
    season = get_season(user_id, field_id, season_id)
    if season is not None:
        return season, 200
    else:
        return jsonify({"data": "Failed to retrieve the season"}), 500


@api.route("/register/<int:field_id>/<season_id>", methods=["POST"])
@authentication_required
def register_season(user_id, data, field_id, season_id):
    inserted_season = insert_season(user_id, field_id, season_id, data)
    if inserted_season is not None:
        return inserted_season, 201
    else:
        return jsonify({"data": "Failed to register the season"}), 500


@api.route("/upgister/<int:field_id>/<season_id>", methods=["POST"])
@authentication_required
def upgister_season(user_id, data, field_id, season_id):
    updated_season = update_season(user_id, field_id, season_id, data)
    if updated_season is not None:
        return updated_season, 201
    else:
        return jsonify({"data": "Failed to update the season"}), 500


@api.route("/unregister/<int:field_id>/<season_id>", methods=["DELETE"])
@authentication_required
def unregister_season(user_id, _, field_id, season_id):
    deleted_ndvi_raster = get_ndvi_raster(user_id, field_id, season_id)
    if deleted_ndvi_raster is not None and delete_season(user_id, field_id, season_id):
        try:
            os.remove(os.path.join(NDVI.data_folder, deleted_ndvi_raster))
        except Exception as error:
            print("[Season API]", error)
            return jsonify({"data": "Failed to unregister the associated NDVI raster"}), 500
        return jsonify({"data": "Successfully unregister the season"}), 204
    else:
        return jsonify({"data": "Failed to unregister the season"}), 500


@api.route("/recommend_fertilizer/<int:field_id>/<season_id>", methods=["POST"])
@authentication_required
def recommend_fertilizer(user_id, data, field_id, season_id):
    season = get_season(user_id, field_id, season_id)
    if season is not None:
        fertilizer = data["fertilizer"]
        season["fertilizer_applications"].append({"fertilizer": fertilizer,
                                                  "amount": -1})
        response = requests.post(RECOMMENDATION.service_url,
                                 headers={"Content-Type": "application/json"},
                                 json=season).json()
        return jsonify(response), 200
    else:
        return jsonify({"data": "Failed to retrieve the season"}), 500
