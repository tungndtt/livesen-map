import time
import schedule
from threading import Thread
from keras.models import load_model
import app_state
import preprocess
from config import MODEL


__model = None


def __update_model():
    global __model
    __model = load_model(MODEL.model_path)
    __model.load_weights(MODEL.weights_path)


def __run_job():
    __update_model()
    schedule.every(7).days.do(__update_model)
    while app_state.is_on():
        schedule.run_pending()
        time.sleep(4)


def init():
    Thread(target=__run_job).start()


def recommend(data):
    global __model
    if __model:
        encoded_data, _ = preprocess.encode_data(data)
        return float(__model.predict([encoded_data])[0][0])
    else:
        return None
