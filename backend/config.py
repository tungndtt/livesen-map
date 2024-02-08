from typing import Any


class Jwtoken:
    secret: str | None = None

    def parse(self, config: dict[str, Any]) -> None:
        self.secret = config["secret"]


class Mailer:
    email: str | None = None
    password: str | None = None
    service_url: str | None = None

    def parse(self, config: dict[str, Any]) -> None:
        self.email = config["email"]
        self.password = config["password"]
        self.service_url = config["service_url"]


class Ndvi:
    data_folder: str | None = None

    def parse(self, config: dict[str, Any]) -> None:
        self.data_folder = config["data_folder"]


class Downloader:
    user: str | None = None
    password: str | None = None
    data_folder: str | None = None
    is_downloading: bool | None = None

    def parse(self, config: dict[str, Any]) -> None:
        self.user = config["user"]
        self.password = config["password"]
        self.data_folder = config["data_folder"]
        self.is_downloading = config["is_downloading"]


class Storage:
    user: str | None = None
    password: str | None = None
    host: str | None = None
    port: int | None = None
    dbname: str | None = None

    def parse(self, config: dict[str, Any]) -> None:
        self.user = config["user"]
        self.password = config["password"]
        self.host = config["host"]
        self.port = config["port"]
        self.dbname = config["dbname"]


class App:
    host: str | None = None
    port: int | None = None
    is_testing: bool | None = None

    def parse(self, config: dict[str, Any]) -> None:
        self.host = config["host"]
        self.port = config["port"]
        self.is_testing = config["is_testing"]


class Constant:
    straubing_coordination: tuple[float] | None = None
    max_recommended_fertilizer: float | None = None

    def parse(self, config: dict[str, Any]) -> None:
        self.straubing_coordination = config["straubing_coordination"]
        self.max_recommended_fertilizer = config["max_recommended_fertilizer"]


class Recommendation:
    service_url: str | None = None

    def parse(self, config: dict[str, Any]) -> None:
        self.service_url = config["service_url"]


__initialized = False
JWTOKEN = Jwtoken()
MAILER = Mailer()
NDVI = Ndvi()
DOWNLOADER = Downloader()
STORAGE = Storage()
RECOMMENDATION = Recommendation()
APP = App()
CONSTANT = Constant()


def __init():
    global __initialized, JWTOKEN, MAILER, NDVI, DOWNLOADER, STORAGE, RECOMMENDATION, APP, CONSTANT
    if not __initialized:
        import json
        with open("config.json", "r") as f:
            config = json.load(f)
        JWTOKEN.parse(config["jwtoken"])
        MAILER.parse(config["mailer"])
        NDVI.parse(config["ndvi"])
        DOWNLOADER.parse(config["downloader"])
        STORAGE.parse(config["storage"])
        RECOMMENDATION.parse(config["recommendation"])
        APP.parse(config["app"])
        CONSTANT.parse(config["constant"])
        __initialized = True


__init()
