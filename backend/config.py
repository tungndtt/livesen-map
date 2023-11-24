import os


class Jwtoken:
    secret = None

    def parse(self, config):
        self.secret = config["secret"]


class Mailer:
    email = None
    password = None

    def parse(self, config):
        self.email = config["email"]
        self.password = config["password"]


class Rastextractor:
    data_folder = None

    def parse(self, config):
        self.data_folder = os.path.join(".", *config["data_folder"])


class Downloader:
    user = None
    password = None
    data_folder = None

    def parse(self, config):
        self.user = config["user"]
        self.password = config["password"]
        self.data_folder = os.path.join(".", *config["data_folder"])


class Storage:
    user = None
    password = None
    host = None
    port = None
    dbname = None

    def parse(self, config):
        self.user = config["user"]
        self.password = config["password"]
        self.host = config["host"]
        self.port = config["port"]
        self.dbname = config["dbname"]


class App:
    host = None
    port = None
    dev_mode = None

    def parse(self, config):
        self.host = config["host"]
        self.port = config["port"]
        self.dev_mode = config["dev_mode"]


__initialized = False
JWTOKEN = Jwtoken()
MAILER = Mailer()
RASTEXTRACTOR = Rastextractor()
DOWNLOADER = Downloader()
STORAGE = Storage()
APP = App()


def __init():
    global __initialized, JWTOKEN, MAILER, RASTEXTRACTOR, DOWNLOADER, STORAGE
    if not __initialized:
        import json
        with open("config.json", "r") as f:
            config = json.load(f)
        JWTOKEN.parse(config["jwtoken"])
        MAILER.parse(config["mailer"])
        RASTEXTRACTOR.parse(config["rastextractor"])
        DOWNLOADER.parse(config["downloader"])
        STORAGE.parse(config["storage"])
        APP.parse(config["app"])
        __initialized = True


__init()
