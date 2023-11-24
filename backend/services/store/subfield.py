from services.store.storage import DbCursor


def __parse_record(record):
    if record is None:
        return None
    id, field_id, period_id, geojson, area, recommended_fertilizer_amount = record
    return {
        "id": id,
        "field_id": field_id,
        "period_id": period_id,
        "coordinates": geojson["coordinates"],
        "area": area,
        "recommended_fertilizer_amount": recommended_fertilizer_amount
    }


def update_subfield_recommended_fertilizer_amount(subfield_id, recommended_fertilizer_amount):
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            "UPDATE subfield SET recommended_fertilizer_amount = %s WHERE id = %s",
            (subfield_id, recommended_fertilizer_amount,)
        )
    return db_cursor.error is None


def insert_subfield(user_id, field_id, period_id, region):
    inserted_subfield = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            INSERT INTO subfield(user_id, field_id, period_id, region)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """,
            (user_id, field_id, period_id, region,)
        )
        subfield_id = cursor.fetchone()[0]
        cursor.execute(
            """
            UPDATE subfield SET area = ST_Area(region) WHERE id = %s
            RETURNING id, field_id, period_id, ST_AsGeoJSON(region), area, recommended_fertilizer_amount
            """,
            (subfield_id, )
        )
        inserted_subfield = __parse_record(cursor.fetchone())
    return inserted_subfield if db_cursor.error is None else None


def list_subfields(user_id, field_id, period_id):
    subfields = None
    db_cursor = DbCursor()
    with db_cursor as cursor:
        cursor.execute(
            """
            SELECT id, field_id, period_id, ST_AsGeoJSON(region), area, recommended_fertilizer_amount
            FROM subfield
            WHERE user_id = %s, field_id = %s, period_id = %s
            """,
            (user_id, field_id, period_id,)
        )
        subfields = [__parse_record(record) for record in cursor.fetchall()]
    return subfields if db_cursor.error is None else None
