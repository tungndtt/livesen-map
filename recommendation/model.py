from datetime import datetime, timedelta
from keras.models import load_model
import preprocess
from config import MODEL


__model = None
__last_update = None


def __load_model():
    global __model, __last_update
    __model = load_model(MODEL.model_path)
    __model.load_weights(MODEL.weights_path)
    __last_update = datetime.now()


def recommend(data):
    global __model, __last_update
    if __model is None:
        __load_model()
    if __model:
        # lazy update model every week
        if __last_update < datetime.now() - timedelta(days=7):
            __load_model()
        encoded_data, _ = preprocess.encode_data(data)
        return float(__model.predict([encoded_data])[0][0])
    else:
        return None
