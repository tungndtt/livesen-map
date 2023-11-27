from flask import Blueprint
from api.authentication import authentication_required
import os
from config import DOWNLOADER


api = Blueprint("period", __name__, url_prefix="/period")


@api.route("/", methods=["GET"])
@authentication_required
def list_scan_periods(_, __):
    return [
        file[:-3] for file in os.listdir(DOWNLOADER.data_folder)
        if (
            os.path.isfile(os.path.join(DOWNLOADER.data_folder, file))
            and not file.startswith("temp_")
            and file.endswith(".nc")
        )
    ], 200
