from config import METADATA


def init():
    pass


def term():
    pass


def recommend_fertilizer(ndvi: float, measurement_data: dict[str, int | float]) -> float | int | None:
    """
    This is a dummy calculation of fertilizer recommendation. 
    Feel free to replace with appropriate calculation logic
    """
    nitrate, phosphor, potassium = (
        measurement_data["nitrate"],
        measurement_data["phosphor"],
        measurement_data["potassium"]
    )
    if nitrate is None and phosphor is None and potassium is None:
        return None
    nitrate = nitrate if nitrate is not None else 0
    phosphor = phosphor if phosphor is not None else 0
    potassium = potassium if potassium is not None else 0
    m_ndvi = measurement_data["ndvi"]
    return METADATA.max_recommended_fertilizer - max(0, min(ndvi/m_ndvi * (nitrate + phosphor + potassium), METADATA.max_recommended_fertilizer))
