from flask import Blueprint
from services.store.subfield import list_subfields
from api.authentication import authentication_required


api = Blueprint("subfield", __name__, url_prefix="/subfield")


@api.route("/all", methods=["GET"])
@authentication_required
def list_all_subfields(user_id, data):
    pass
