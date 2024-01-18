import os
from typing import Any


class Model:
    data_folder: str | None = None
    model_path: str | None = None
    weights_path: str | None = None
    temp_weights_path: str | None = None
    processed_data_path: str | None = None

    def parse(self, config: dict[str, Any]) -> None:
        self.data_folder = config["data_folder"]
        self.model_path = os.path.join(self.data_folder, "model.h5")
        self.weights_path = os.path.join(self.data_folder, "weights.h5")
        self.temp_weights_path = os.path.join(self.data_folder,
                                              "temp_weights.h5")
        self.processed_data_path = os.path.join(self.data_folder,
                                                "preprocessed_data.csv")


class Category:
    data_folder: str | None = None

    def parse(self, config: dict[str, Any]) -> None:
        self.data_folder = config["data_folder"]


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

    def parse(self, config: dict[str, Any]) -> None:
        self.host = config["host"]
        self.port = config["port"]


__initialized = False
MODEL = Model()
CATEGORY = Category()
STORAGE = Storage()
APP = App()


def __init():
    global __initialized, MODEL, CATEGORY, STORAGE, APP
    if not __initialized:
        import json
        with open("config.json", "r") as f:
            config = json.load(f)
        MODEL.parse(config["model"])
        CATEGORY.parse(config["category"])
        STORAGE.parse(config["storage"])
        APP.parse(config["app"])
        __initialized = True


__init()
