import os
from psycopg2 import connect
from config import CATEGORY, MODEL, STORAGE


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


def __load_categories():
    global __categories, __column_order
    __categories = {}
    for field, csv_file in [
        ["maincrop", "crop.csv"],
        ["intercrop", "crop.csv"],
        ["soil_type", "soil.csv"],
        ["variety", "variety.csv"],
        ["fertilizer_applications", "fertilizer.csv"],
        ["soil_tillage_applications", "soil_tillage.csv"],
        ["crop_protection_applications", "crop_protection.csv"]
    ]:
        with open(os.path.join(CATEGORY.data_folder, csv_file), "r") as file:
            values = file.readline().split(",")
            __categories[field] = values
    __column_order = [
        "nitrate", "phosphor", "potassium", "ph", "rks",
        "seed_density", "max_allowed_fertilizer", "harvest_weight",
    ]
    for field in [
        "maincrop", "intercrop", "soil_type", "variety",
        "soil_tillage_applications",
        "crop_protection_applications"
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


def __find_category(data: str | None, field: str):
    if not data:
        return None
    for category in __categories[field]:
        if category == data:
            return category


def encode_data(d):
    if __categories is None:
        __load_categories()
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


def __parse_record(record: tuple):
    if record is None:
        return None
    return {col: record[i] for i, col in enumerate(__fields)}


def init():
    db_params = {
        "dbname": STORAGE.dbname,
        "user": STORAGE.user,
        "password": STORAGE.password,
        "host": STORAGE.host,
        "port": STORAGE.port,
    }
    # Connect to the PostgreSQL server
    retry = 0
    conn = None
    while retry < 20:
        from time import sleep
        try:
            conn = connect(**db_params)
            break
        except:
            retry += 1
            sleep(2)
    if conn is None:
        return False
    cursor = conn.cursor()
    status = True
    if os.path.exists(MODEL.processed_data_path):
        return status
    with open(MODEL.processed_data_path, "w") as file:
        try:
            columns = ",".join(__fields)
            cursor.execute(f"SELECT {columns} FROM season")
            for record in cursor:
                sample, label = encode_data(__parse_record(record))
                sample.append(label)
                file.write(",".join([str(e) for e in sample]) + "\n")
        except:
            os.remove(MODEL.processed_data_path)
            status = False
        finally:
            cursor.close()
            conn.close()
            file.close()
    return status
