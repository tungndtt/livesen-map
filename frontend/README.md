# Livesen-Map Client

The client component of the project is implemented in [TypeScript](https://www.typescriptlang.org/) and leverages powerful technologies [React](https://react.dev/), [Material UI](https://mui.com/), [Leaflet](https://leafletjs.com/), [GeoTiff](https://github.com/GeoTIFF/geotiff.io) and [GeoRaster](https://github.com/GeoTIFF/georaster)

## Configuration

The client component of the project requires a configuration file named `.env`, which should be located in the client's working directory. This file contains important settings that the client relies on. Below is an example of the configuration along with explanations for each field

```
REACT_APP_SERVER_URL=/api
REACT_APP_IS_TESTING=false
```

Configuration fields:

- **REACT_APP_SERVER_URL**: Specifies the server URL that the client communicates with
- **REACT_APP_IS_TESTING**: Specifies whether the client runs in test mode, i.e., no authentication and no account registration required. By not specifying the field, the client runs in non-testing mode
- **REACT_APP_OSM_URL**: Specifies the OSM server to fetch the map tiles. By not specifying the field, the client fetches from [OSM public server](https://www.openstreetmap.org/)

## Local Development

- Make sure [NodeJS](https://nodejs.org/en) installed on local machine
- Install dependencies: `npm install -f`
- Run the client: `npm run start`
- Make sure reverse proxy start with [config](../nginx.conf)
- If you localize the OSM on http://localhost:1998, uncomment the `REACT_APP_OSM_URL` in [.env](.env) and `/osm/` in [nginx.conf](../nginx.conf)
- Client should be accessible via http://localhost:8080

## Production
