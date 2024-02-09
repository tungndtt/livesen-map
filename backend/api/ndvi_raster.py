from flask import Blueprint, jsonify, send_from_directory
from api.authentication import authentication_required
from services.store.dafs.field import get_field
from services.store.dafs.ndvi_raster import get_ndvi_raster, list_ndvi_rasters, insert_ndvi_raster
from utils.algo.field_ndvi import get_field_ndvi
from config import NDVI


api = Blueprint("ndvi_raster", __name__, url_prefix="/ndvi_raster")


@api.route("/<path:ndvi_raster>", methods=["GET"])
@authentication_required
def retrieve_ndvi_raster(_, __, ndvi_raster):
    return send_from_directory(NDVI.data_folder, ndvi_raster)


@api.route("/<int:field_id>", methods=["GET"])
@authentication_required
def retrieve_ndvi_rasters(user_id, _, field_id):
    ndvi_rasters = list_ndvi_rasters(user_id, field_id)
    if ndvi_rasters is not None:
        return ndvi_rasters, 200
    else:
        return jsonify({"data": "No ndvi raster associated with given field"}), 404


@api.route("/<int:field_id>/<season_id>", methods=["GET"])
@authentication_required
def register_ndvi_raster(user_id, _, field_id, season_id):
    return handle_ndvi_raster(user_id, field_id, season_id)


def handle_ndvi_raster(user_id, field_id, season_id):
    data = get_ndvi_raster(user_id, field_id, season_id)
    if data is not None:
        return jsonify({"data": data}), 200
    field = get_field(user_id, field_id)
    if field is None:
        return jsonify({"data": "No field with given id"}), 404
    data = get_field_ndvi(field["coordinates"], season_id)
    if data is None:
        return jsonify({"data": "No ndvi-scan of field in given period"}), 404
    else:
        ndvi_raster, source_date = data
        if insert_ndvi_raster(user_id, field_id, season_id, ndvi_raster, source_date):
            return jsonify({"data": data}), 201
        else:
            return jsonify({"data": "Failed to process field ndvi"}), 500
