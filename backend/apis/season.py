from flask import Blueprint, jsonify, send_from_directory
from apis.authentication import authentication_required
from logics.season import get_ndvi_raster, get_season_options, get_season, add_season, modify_season, remove_season, get_season_fertilizer_recommendation
from logics.event import publish
from config import NDVI


api = Blueprint("season", __name__, url_prefix="/season")


@api.route("/ndvi/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_ndvi_raster(user_id, _, field_id, season_id):
    ndvi_raster, ndvi_date = get_ndvi_raster(user_id, field_id, season_id)
    if ndvi_raster is not None:
        response = send_from_directory(NDVI.data_folder, ndvi_raster)
        response.headers.add("ndvi_date", str(ndvi_date))
        return response
    else:
        return jsonify({"data": "Failed to fetch NDVI map"}), 404


@api.route("/<int:field_id>", methods=["GET"])
@authentication_required
def retrieve_season_options(user_id, _, field_id):
    season_ids = get_season_options(user_id, field_id)
    if season_ids is not None:
        return season_ids, 200
    else:
        return jsonify({"data": "Failed to retrieve the season options"}), 404


@api.route("/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_season(user_id, _, field_id, season_id):
    season = get_season(user_id, field_id, season_id)
    if season is not None:
        return season, 200
    else:
        return jsonify({"data": "Failed to retrieve the season"}), 404


@api.route("/register/<int:field_id>/<season_id>", methods=["POST"])
@authentication_required
def register_season(user_id, data, field_id, season_id):
    inserted_season = add_season(user_id, field_id, season_id, data)
    if inserted_season is not None:
        if publish(user_id, "season.create", inserted_season):
            return jsonify({"data": "Successfully register the season"}), 201
        else:
            return jsonify({"data": "Successfully register the season but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to register the season"}), 500


@api.route("/upgister/<int:field_id>/<season_id>", methods=["POST"])
@authentication_required
def upgister_season(user_id, data, field_id, season_id):
    updated_season = modify_season(user_id, field_id, season_id, data)
    if updated_season is not None:
        if publish(user_id, "season.update", updated_season):
            return jsonify({"data": "Successfully update the season"}), 201
        else:
            return jsonify({"data": "Successfully update the season but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to update the season"}), 500


@api.route("/unregister/<int:field_id>/<season_id>", methods=["DELETE"])
@authentication_required
def unregister_season(user_id, _, field_id, season_id):
    if remove_season(user_id, field_id, season_id):
        if publish(user_id, "season.delete", {"field_id": field_id, "season_id": season_id}):
            return jsonify({"data": "Successfully unregister the season"}), 204
        else:
            return jsonify({"data": "Successfully unregister the season but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to unregister the associated NDVI raster"}), 500


@api.route("/recommend_fertilizer/<int:field_id>/<season_id>", methods=["POST"])
@authentication_required
def recommend_fertilizer_season(user_id, data, field_id, season_id):
    fertilizer = data["fertilizer"]
    recommended_fertilizer = get_season_fertilizer_recommendation(
        user_id, field_id, season_id, fertilizer)
    if recommended_fertilizer is not None:
        return jsonify({"data": recommended_fertilizer}), 200
    else:
        return jsonify({"data": "Failed to compute the season fertilier recommendation"}), 500
