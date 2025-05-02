UPDATE business
SET name = %s,
    address = %s,
    city = %s,
    state = %s,
    postal_code = %s,
    latitude = %s,
    longitude = %s,
    is_open = %s,
    attributes = %s,
    categories = %s,
    hours = %s
WHERE business_id = %s AND business_account_id = %s;