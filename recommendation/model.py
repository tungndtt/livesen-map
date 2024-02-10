import time
import schedule
from threading import Thread, Event
from keras.models import load_model
import preprocess
from config import MODEL

__event = None
__thread = None
__model = None


def __update_model():
    global __model
    try:
        __model = load_model(MODEL.model_path)
        __model.load_weights(MODEL.weights_path)
    except Exception as error:
        print("[Model]", error)


def __run_job():
    __update_model()
    schedule.every(MODEL.update_period).days.do(__update_model)
    while __event.is_set():
        schedule.run_pending()
        time.sleep(4)


def init():
    global __event, __thread
    if __thread is None:
        __event = Event()
        __event.set()
        __thread = Thread(target=__run_job)
        __thread.start()


def term():
    global __event, __thread
    if __thread is not None:
        __event.clear()
        __thread.join()


def recommend(data):
    global __model
    if __model:
        encoded_data, _ = preprocess.encode_data(data)
        return float(__model.predict([encoded_data])[0][0])
    else:
        return None
