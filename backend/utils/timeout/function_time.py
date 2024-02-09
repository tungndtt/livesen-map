import multiprocessing
import time


def __trigger_function(result, f, *args):
    result["data"] = f(*args)


def timeout_function(timeout, f, *args):
    result = multiprocessing.Manager().dict()
    process = multiprocessing.Process(target=__trigger_function,
                                      args=(result, f, *args,))
    start_time = time.time()
    process.start()
    while time.time() - start_time < timeout and process.is_alive():
        time.sleep(0.2)
    process.terminate()
    if "data" in result:
        return result["data"]
    else:
        return None
