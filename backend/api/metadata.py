from flask import Blueprint, jsonify
from api.authentication import authentication_required
from config import METADATA

api = Blueprint("metadata", __name__, url_prefix="/metadata")


@api.route("", methods=["GET"])
@authentication_required
def retrieve_metadata(_, __):
    data = {
        "max_recommended_fertilizer": METADATA.max_recommended_fertilizer,
        "crops": METADATA.crops,
        "soils": METADATA.soils,
        "varieties": METADATA.varieties,
        "fertilizers": METADATA.fertilizers,
        "fertilizer_types": METADATA.fertilizer_types,
        "crop_protections": METADATA.crop_protections,
        "soil_tillages": METADATA.soil_tillages,
        "soil_conditions": METADATA.soil_conditions,
    }
    return jsonify({"data": data}), 200
