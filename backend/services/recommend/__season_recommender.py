import time
import schedule
from threading import Thread, Event
from xgboost import XGBRegressor
from config import METADATA, RECOMMENDER


__categories: dict[str, set[str]] | None = None
__fields = [
    "nitrate", "phosphor", "potassium", "ph", "rks",
    "harvest_weight", "seed_density", "max_allowed_fertilizer",
    "maincrop", "intercrop", "soil_type", "variety",
    "fertilizer_applications",
    "soil_tillage_applications",
    "crop_protection_applications",
]
__column_order: list[str] | None = None


def __load_categories() -> None:
    global __categories, __column_order
    __categories = {}
    for field, category in [
        ["maincrop", "crops"],
        ["intercrop", "crops"],
        ["soil_type", "soils"],
        ["variety", "varieties"],
        ["fertilizer_applications", "fertilizers"],
        ["soil_tillage_applications", "soil_tillages"],
        ["crop_protection_applications", "crop_protections"]
    ]:
        __categories[field] = getattr(METADATA, category)
    __column_order = [
        "nitrate", "phosphor", "potassium", "ph", "rks",
        "harvest_weight", "seed_density", "max_allowed_fertilizer",
    ]
    for field in [
        "maincrop", "intercrop", "soil_type", "variety",
        "soil_tillage_applications",
        "crop_protection_applications",
    ]:
        __column_order += [f"{field}_{category}" for category in __categories[field]]
    __column_order += [
        f"fertilizer_applications_nitrogen_{category}"
        for category in __categories["fertilizer_applications"]
    ] + [
        f"fertilizer_applications_amount_{category}"
        for category in __categories["fertilizer_applications"]
    ] + [
        f"category_{category}"
        for category in __categories["fertilizer_applications"]
    ]


def __find_category(data: str | None, field: str) -> str | None:
    if not data:
        return None
    for category in __categories[field]:
        if category == data:
            return category
    return None


def __encode_data(d) -> tuple[list | None, float | None]:
    if __categories is None:
        return None, None
    sample, label = {}, 0
    for field in __fields:
        data = d[field]
        if (
            field == "maincrop"
            or field == "intercrop"
            or field == "soil_type"
            or field == "variety"
        ):
            for category in __categories[field]:
                sample[f"{field}_{category}"] = 0
            category = __find_category(data, field)
            if category:
                sample[f"{field}_{category}"] += 1
        elif field == "fertilizer_applications":
            for k in ["amount", "nitrogen"]:
                for category in __categories[field]:
                    sample[f"{field}_{k}_{category}"] = 0
                for item in data[:-1]:
                    category = __find_category(item["fertilizer"], field)
                    value = item[k]
                    if category:
                        sample[f"{field}_{k}_{category}"] += (
                            float(value) if value else 0
                        )
            for category in __categories[field]:
                sample[f"category_{category}"] = 0
            if len(data) > 0:
                category = __find_category(data[-1]["fertilizer"], field)
                sample[f"category_{category}"] = 1
                label = data[-1]["amount"]
        elif field == "soil_tillage_applications":
            for category in __categories[field]:
                sample[f"{field}_{category}"] = 0
            for item in data:
                category = __find_category(item["type"], field)
                if category:
                    sample[f"{field}_{category}"] += 1
        elif field == "crop_protection_applications":
            for value in __categories[field]:
                sample[f"{field}_{value}"] = 0
            for item in data:
                category = __find_category(item["type"], field)
                value = item["amount"]
                if category:
                    sample[f"{field}_{category}"] += (
                        float(value) if value else 0
                    )
        else:
            sample[field] = float(data) if data else 0
    return [sample[column] for column in __column_order], label


__event = None
__thread = None
__model = None


def __update_model():
    global __model
    try:
        if __categories is None:
            __load_categories()
        if __model is None:
            __model = XGBRegressor()
        __model.load_model(RECOMMENDER.model_path)
    except Exception as error:
        print("[Recommender]", error)


def __run_job():
    __update_model()
    schedule.every(1).days.do(__update_model)
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


def recommend_fertilizer(season_data):
    global __model
    if __model:
        encoded_data, _ = __encode_data(season_data)
        if encoded_data is not None:
            return float(__model.predict([encoded_data])[0])
    return None
