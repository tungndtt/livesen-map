import os
import schedule
import time
import multiprocessing
import numpy
from keras.models import load_model
import preprocess
from config import MODEL


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
    model.compile(optimizer="adam", loss="mean_squared_error")
    # train the model in 100 epochs with batch size = 128
    # early stop with patience = 10 and save the best model
    best_val_loss = None
    patience_count = 0
    for _ in range(100):
        val_loss = 0
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
                    if not X:
                        break
                    history = model.fit(numpy.array(X), numpy.array(y),
                                        epochs=1, validation_split=0.1)
                    val_loss += history.history["val_loss"][0]
            if best_val_loss is None or best_val_loss > val_loss:
                model.save_weights(MODEL.weights_path)
                best_val_loss = val_loss
                patience_count = 0
            else:
                patience_count += 1
                if patience_count == 10:
                    break
        except KeyboardInterrupt:
            model.save_weights(MODEL.temp_weights_path)


def __incremental_train():
    # preporcess data
    if not preprocess.init():
        return
    # train the model
    __train_model()
    # cleanup preprocessed data
    os.remove(MODEL.processed_data_path)


# process for incremental training
__process = None


def __run_job():
    __incremental_train()
    schedule.every(14).days.do(__incremental_train)
    while True:
        schedule.run_pending()
        time.sleep(14 * 24 * 60 * 60)


def init():
    global __process
    if __process is None:
        __process = multiprocessing.Process(target=__run_job)
        __process.start()
