import os
from datetime import datetime, timedelta
import pytz
import requests
from config import NDVI


def __seasonid2date(season_id: str) -> datetime:
    year, month, day = season_id.split("-")
    timezone = pytz.timezone("Europe/Berlin")
    return datetime(
        year=int(year), month=int(month), day=int(day), tzinfo=timezone
    )


def register_parcel(season_id: str, coordinates: list[list[list[float]]]) -> int | None:
    season_date = __seasonid2date(season_id)
    start_date = season_date - timedelta(days=7)
    end_date = season_date + timedelta(days=7)
    response = requests.post(
        url=f"{NDVI.url}/parcels",
        json={
            "crop": "", 
            "name": "", 
            "planting": "%04d-%02d-%02d" % (start_date.year, start_date.month, start_date.day), 
            "harvest": "%04d-%02d-%02d" % (end_date.year, end_date.month, end_date.day), 
            "geometry": {"type": "Polygon", "coordinates": coordinates}
        },
        params={"key": NDVI.api_key},
        headers={"Content-Type": "application/json"}
    )
    if response.status_code < 400:
        response_body = response.json()
        return response_body["content"]["parcel_id"]
    return None


def unregister_parcel(parcel_id: int) -> None:
    requests.delete(
        url=f"{NDVI.url}/parcels/{parcel_id}",
        params={"key": NDVI.api_key}
    )


def download_raster(season_id: str, parcel_id: int) -> tuple[str, datetime] | tuple[None, None]:
    response = requests.get(
        url=f"{NDVI.url}/parcels/{parcel_id}/ndvi",
        params={"key": NDVI.api_key}
    )
    if response.status_code >= 400:
        return None, None
    season_date = __seasonid2date(season_id)
    response_body = response.json()
    ndvi_raster, ndvi_date = None, None
    for raster in response_body["content"]:
        raster_date = __seasonid2date(raster["date"])
        if (
            ndvi_date is None or 
            abs((season_date - raster_date).days) < abs((season_date - ndvi_date).days)
        ):
            ndvi_date = raster_date
            ndvi_raster =  "%d.tif" % raster["raster_id"]
    response = requests.get(
        url=f"{NDVI.url}/parcels/{parcel_id}/ndvi/sentinel2/{ndvi_raster}",
        params={"key": NDVI.api_key},
        stream=True
    )
    if response.status_code >= 400:
        return None, None
    with open(os.path.join(NDVI.data_folder, ndvi_raster), "wb") as file:
        for chunk in response:
            file.write(chunk)
    return ndvi_raster, ndvi_date