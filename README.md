# Livesen-Map

The web application serves as a platform for providing fertilizer recommendations tailored to specific agricultural fields. It is an integral component of the collaborative initiative known as the [Livesen-Map project](https://www.livesen-map.eu/), a partnership between the bioinformatics department of the Technical University Munich and the European Innovation Council

## Structure

The project is organized with a straight-forward structure, consisting of a **server** component located in `backend`, and a **client** component located in `frontend`

## Configuration

Please refer to [server configuration](./backend) and [client configuration](./frontend)

## Development

### Local

If you wish to set up and run the project on your local machine, please refer to the following guides:

- For instructions on setting up the server locally, please refer to [server local setup](./backend)
- For instructions on setting up the client locally, please refer to [client local setup](./frontend)
- For reverse proxy, please install [nginx]() on local machine. Start reverse proxy with [config](./nginx.conf)

These guides will provide you with step-by-step instructions on how to configure and run both the server and client components of the project on your local environment

### Docker

To simplify the process of running the application locally, Docker can be utilized. Ensure Docker is installed on your machine by following the instructions provided in the [installation guide](https://docs.docker.com/get-docker/)

After installation, proceed to configure the server configuration file backend.json and the client configuration file frontend.conf, both located in the [.docker](./.docker) (navigate to [Configuaration](#Configuration) for details on component configurations). These configurations will be mounted into the container and utilized for server and client initialization. Additionally, the data folders used by server services will be mounted into the `./.docker/data` folder, enabling accessibility and configurability

By default, the client fetches map tiles from [OpenStreetMap (OSM) public server](https://www.openstreetmap.org/). If you wish to localize OSM, uncomment the `livesen-osmap` config in [docker-compose.yml](docker-compose.yml), `REACT_APP_OSM_URL` in [frontend.conf](./.docker/frontend.conf) and endpoint `/osm/` in [proxy.conf](./.docker/proxy.conf)

Once Docker is installed, you can run the application with a single command:

```bash
docker compose up
```

This command will automatically set up and start the application containers, making the app accessible via http://localhost:8080

## Production
