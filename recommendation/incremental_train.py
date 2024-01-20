import os
import schedule
import time
import multiprocessing
import numpy
from keras.models import load_model
import app_state
import preprocess
from config import MODEL


# process for incremental training
__process = None


def __load_model():
    model = load_model(MODEL.model_path)
    # continue to train the weights on the last pause
    if os.path.isfile(MODEL.temp_weights_path):
        model.load_weights(MODEL.temp_weights_path)
        os.remove(MODEL.temp_weights_path)
    # otherwise, train the current weights
    else:
        model.load_weights(MODEL.weights_path)
    return model


def __train_model():
    model = __load_model()
    if model is None:
        return False
    train_done = True
    model.compile(optimizer="adam", loss="mean_squared_error")
    # train the model in 100 epochs with batch size = 128
    # early stop with patience = 10 and save the best model
    best_val_loss = None
    patience_count = 0
    for _ in range(100):
        total_val_loss = 0
        try:
            with open(MODEL.processed_data_path, "r", encoding="utf-8") as f:
                while True:
                    X, y = [], []
                    for _ in range(128):
                        line = f.readline()
                        if not line:
                            break
                        data = line.split(",")
                        X.append([float(e) for e in data[:-1]])
                        y.append(float(data[-1]))
                    if len(X) < 10:
                        break
                    history = model.fit(numpy.array(X), numpy.array(y),
                                        epochs=1, validation_split=0.1)
                    total_val_loss += history.history["val_loss"][0]
            if best_val_loss is None or best_val_loss > total_val_loss:
                model.save_weights(MODEL.weights_path)
                best_val_loss = total_val_loss
                patience_count = 0
            else:
                patience_count += 1
                if patience_count == 10:
                    break
        except:
            train_done = False
            model.save_weights(MODEL.temp_weights_path)
    return train_done


def __incremental_train():
    # preprocess data
    if not preprocess.init():
        return
    # train the model
    if __train_model():
        # cleanup preprocessed data if train is done
        os.remove(MODEL.processed_data_path)


def __run_job():
    __incremental_train()
    schedule.every(14).days.do(__incremental_train)
    while app_state.is_on():
        schedule.run_pending()
        time.sleep(4)


def init():
    global __process
    if __process is None:
        __process = multiprocessing.Process(target=__run_job)
        __process.start()
