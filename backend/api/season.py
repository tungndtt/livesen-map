import os
from flask import Blueprint, jsonify, send_from_directory
from api.authentication import authentication_required
from services.store.dafs.field import get_field
from services.store.dafs.season import get_season, list_season_ids, insert_season, update_season, delete_season, list_ndvi_rasters
from services.store.dafs.measurement import list_sample_images
from services.recommend.recommender import recommend_season_fertilizer
from services.notify.notifier import publish_event
from libs.algo.field_ndvi import get_field_ndvi
from config import NDVI, MEASUREMENT


api = Blueprint("season", __name__, url_prefix="/season")


@api.route("/ndvi/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def retrieve_ndvi_raster(user_id, _, field_id, season_id):
    ndvi_raster, ndvi_date = handle_ndvi_raster(user_id, field_id, season_id)
    if ndvi_raster is not None:
        response = send_from_directory(NDVI.data_folder, ndvi_raster)
        response.headers.add("ndvi_date", str(ndvi_date))
        return response
    else:
        return jsonify({"data": "Failed to fetch NDVI map"}), 404


@api.route("/<int:field_id>", methods=["GET"])
@authentication_required
def retrieve_season_options(user_id, _, field_id):
    season_ids = list_season_ids(user_id, field_id)
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
    inserted_season = insert_season(user_id, field_id, season_id, data)
    if inserted_season is not None:
        if publish_event(user_id, "season.create", inserted_season):
            return jsonify({"data": "Successfully register the season"}), 201
        else:
            return jsonify({"data": "Successfully register the season but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to register the season"}), 500


@api.route("/upgister/<int:field_id>/<season_id>", methods=["POST"])
@authentication_required
def upgister_season(user_id, data, field_id, season_id):
    updated_season = update_season(user_id, field_id, season_id, data)
    if updated_season is not None:
        if publish_event(user_id, "season.update", updated_season):
            return jsonify({"data": "Successfully update the season"}), 201
        else:
            return jsonify({"data": "Successfully update the season but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to update the season"}), 500


@api.route("/unregister/<int:field_id>/<season_id>", methods=["DELETE"])
@authentication_required
def unregister_season(user_id, _, field_id, season_id):
    ndvi_rasters = list_ndvi_rasters(user_id, field_id, season_id)
    measurement_sample_images = list_sample_images(user_id,
                                                   field_id,
                                                   season_id)
    if delete_season(user_id, field_id, season_id):
        try:
            if ndvi_rasters is not None:
                for ndvi_raster in ndvi_rasters:
                    if ndvi_raster is not None:
                        os.remove(os.path.join(NDVI.data_folder, ndvi_raster))
            if measurement_sample_images is not None:
                for measurement_sample_image in measurement_sample_images:
                    if measurement_sample_image is not None:
                        os.remove(
                            os.path.join(MEASUREMENT.data_folder,
                                         measurement_sample_image)
                        )
        except Exception as error:
            print("[Season API]", error)
        if publish_event(user_id, "season.delete", {"field_id": field_id, "season_id": season_id}):
            return jsonify({"data": "Successfully unregister the season"}), 204
        else:
            return jsonify({"data": "Successfully unregister the season but failed to publish sync event"}), 503
    else:
        return jsonify({"data": "Failed to unregister the associated NDVI raster"}), 500


@api.route("/recommend_fertilizer/<int:field_id>/<season_id>", methods=["POST"])
@authentication_required
def recommend_fertilizer_season(user_id, data, field_id, season_id):
    season = get_season(user_id, field_id, season_id)
    if season is not None:
        fertilizer = data["fertilizer"]
        season["fertilizer_applications"].append({"fertilizer": fertilizer,
                                                  "amount": -1})
        recommended_fertilizer = recommend_season_fertilizer(season)
        if recommend_season_fertilizer is not None:
            return jsonify({"data": recommended_fertilizer}), 200
        else:
            return jsonify({"data": "Failed to compute the season fertilier recommendation"}), 500
    else:
        return jsonify({"data": "Failed to retrieve the season"}), 404


def handle_ndvi_raster(user_id, field_id, season_id):
    season = get_season(user_id, field_id, season_id)
    if season is None:
        return None, None
    if season["ndvi_raster"] is not None:
        return season["ndvi_raster"], season["ndvi_date"]
    field = get_field(user_id, field_id)
    if field is None:
        return None, None
    ndvi_raster, ndvi_date = get_field_ndvi(field["coordinates"], season_id)
    if ndvi_raster is None:
        return None, None
    else:
        data = {"ndvi_raster": ndvi_raster, "ndvi_date": ndvi_date}
        updated_season = update_season(user_id, field_id, season_id, data)
        if updated_season is not None:
            return updated_season["ndvi_raster"], updated_season["ndvi_date"]
        else:
            return None, None
