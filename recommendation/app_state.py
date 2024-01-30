from threading import Event

__app_state = Event()


def init():
    global __app_state
    __app_state.set()


def term():
    global __app_state
    __app_state.clear()


def is_running():
    global __app_state
    return __app_state.is_set()
