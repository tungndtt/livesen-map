from flask import Blueprint, jsonify
from services.store.subfield import list_subfields
from api.authentication import authentication_required


api = Blueprint("subfield", __name__, url_prefix="/subfield")


@api.route("/<field_id>/<period_id>", methods=["GET"])
@authentication_required
def list_all_subfields(user_id, _, field_id, period_id):
    subfields = list_subfields(user_id, field_id, period_id)
    if subfields is None:
        return subfields, 200
    else:
        return jsonify({"data": "Failed to retrieve all subfields"}), 500
