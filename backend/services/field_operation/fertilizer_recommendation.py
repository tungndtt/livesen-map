def compute_fertilizer_recommendation(ndvi: float, data: dict[str, int | float]) -> float | int | None:
    """
    This is a dummy calculation of fertilizer recommendation. 
    Feel free to replace with appropriate calculation logic
    """
    nitrate, phosphor, potassium = data["nitrate"], data["phosphor"], data["potassium"]
    if nitrate is None and phosphor is None and potassium is None:
        return None
    nitrate = nitrate if nitrate is not None else 0
    phosphor = phosphor if phosphor is not None else 0
    potassium = potassium if potassium is not None else 0
    return max(0, min(ndvi * 20 + nitrate + phosphor + potassium, 80))
