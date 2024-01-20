from threading import Event

__app_state = Event()


def on():
    global __app_state
    __app_state.set()


def off():
    global __app_state
    __app_state.clear()


def is_on():
    global __app_state
    return __app_state.is_set()
