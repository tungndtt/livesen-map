from threading import Thread, Event
import schedule
import time
from keras.models import load_model
import preprocess
from config import MODEL


__model = None


def __update_model():
    global __model
    __model = load_model(MODEL.model_path)
    __model.load_weights(MODEL.weights_path)


def __run_job(event: Event):
    days = 7
    __update_model()
    schedule.every(days).days.do(__update_model)
    while event.is_set():
        schedule.run_pending()
        time.sleep(days * 24 * 60 * 60)


def init():
    event = Event()
    event.set()
    thread = Thread(target=__run_job, args=(event,))
    try:
        thread.start()
    except KeyboardInterrupt:
        event.clear()
        thread.join()


def recommend(data):
    if __model:
        encoded_data, _ = preprocess.encode_data(data)
        return __model.predict([encoded_data])[0][0]
    else:
        return None
