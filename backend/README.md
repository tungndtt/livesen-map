# Livesen-Map Server

The server component of the project is implemented in [Python3](https://www.python.org/download/releases/3.0/) and leverages powerful technologies [Flask](https://flask.palletsprojects.com/en/3.0.x/), [JWToken](https://jwt.io/), [PostGIS](https://postgis.net/), [Raster Tiff](https://en.wikipedia.org/wiki/TIFF), [COG](https://www.cogeo.org/), [XGBoost](https://en.wikipedia.org/wiki/XGBoost) and [Redis](https://redis.io/)

## Configuration

The server component of the project requires a configuration file named `config.json`, which should be located in the server's working directory. This file contains important settings that the server relies on. Below is an example of the configuration along with explanations for each field

```json
{
  "mailer": {
    "email": "<server-email>",
    "password": "<server-email-password>"
  },
  "downloader": {
    "user": "<copernicus-username>",
    "password": "<copernicus-password>",
    "data_folder": "./data/download",
    "is_downloading": false
  },
  "storage": {
    "user": "livesen",
    "password": "livesen",
    "host": "localhost",
    "port": 5432,
    "dbname": "livesen"
  },
  "recommender": {
    "model_path": "./data/recommend/model.json"
  },
  "notifier": {
    "host": "localhost",
    "port": 6379,
    "password": "livesen"
  },
  "jwtoken": {
    "secret": "livesen"
  },
  "ndvi": {
    "data_folder": "./data/ndvi"
  },
  "app": {
    "host": "localhost",
    "port": 2204,
    "is_testing": false
  },
  "metadata": {
    "category_folder": "./data/category",
    "max_recommended_fertilizer": 80
  }
}
```

Configuration fields:

- **mailer**: Configuration for mailer service. The service uses the email with credentials `mailer.email` and `mailer.password` to send activation email to user mailbox for activating account registration
- **downloader**: Configuration for downloader service. The service downloads geospatial raster data from [copernicus](https://land.copernicus.vgt.vito.be/PDF/portal/Application.html) using the account with credentials `downloader.user` and `downloader.password`. The downloaded data is stored in the specifed data folder `downloader.data_folder`. `downloader.is_downloading` specifies whether to download the data or not
- **storage**: Configuration for Postgresql storage
- **recommender**: Configuration for season-fertilizer recommender service. `recommender.model_path` specifies where to load the XGBoost model for fertilizer-regression task
- **notifier**: Configuration for Redis notifier system
- **jwtoken**: Specifies the secret used for encoding [JWToken]()
- **ndvi**: Specifies the data folder where the processed NDVI data is stored
- **app**: Specifies the server general configuration. `app.is_testing` indicates whether the server runs in test mode, i.e., no authentication required
- **metadata**: The agricultural constant metadata. `metadata.category_folder` specifies the folder where to load the category data such as soil, soil tillage, crop, crop protection, fertilizer, etc

## Local Development

1. **Setup Postgresql Storage**
   Make sure [Postgresql](https://www.postgresql.org/) and its extension [PostGIS](https://postgis.net/) installed on local machine

2. **Setup Cloud Optimized GeoTIFF**
   Make sure [gdal_translate](https://gdal.org/programs/gdal_translate.html) installed on local machine

3. **Setup Redis**
   Make sure [Redis](https://redis.io/) installed on local machine

4. **Run Server**

- Start Postgresql database
- Start Redis server
- Install dependencies: `pip install -r requirements.txt`
- Make sure reverse proxy start with [config](../nginx.conf)
- Run the server: `python app.py`

## Production
