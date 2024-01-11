# Livesen-Map

A web application for fertilizer recommendations for agricultural fields. The application is part of the [project](https://www.livesen-map.eu/), which is the cooperation between bioinformatics department of Technical University Munich and European Innovation Council

## Structure

The project has a straight-forward structure including **server** (allocated in `/backend`) and **client** (allocated in `/frontend`)

## Configuration

In order to run the application, it is required to setup the server and client configurations. The configurations can be found [here](./.docker)

**⚠️ Important Notes: by `APP.IS_TESTING=true` in the server configuration and `REACT_APP_IS_TESTING=true` in the client configuration, application runs in testing mode and no authentication is required. If you want to fully checkout the application, set both fields to `false`. In case you want to register a new user, server email credentials is required, i.e., you need to fill `mailer.email` and `mailer.password`**

## Deployment

### Local

Following instructions to run the application locally:

1. **In the local enviroment, make sure the following dependencies installed**

- **Postgresql** and its extension **Postgis**
- **Python**
- **Node**

2. **Setup the database**

- Create the database: `initdb -U <username> -A password -E utf8 -W -D <data-folder>`
- Start the database: `pg_ctl -D <data-folder> -l <log-file> start`

3. **Setup the server in `/backend`**

- Install dependencies: `pip install -r requirements.txt`
- Run the server: `python app.py`

4. **Setup the client in `/frontend`**

- Install dependencies: `npm install -f`
- Run the client: `npm run start`

### Docker

Instead of manually setup the local enviroment, it is minimal to run the application with [Docker](https://www.docker.com/) by the command `docker-compose up`. Note: make sure **Docker** installed
