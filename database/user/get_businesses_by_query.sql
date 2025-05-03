SELECT business_id, name, stars, review_count, categories
FROM business
WHERE
    (%s IS NULL OR name ILIKE '%' || %s || '%')
    AND (%s IS NULL OR state = %s)
    AND (%s IS NULL OR is_open = %s::boolean)
ORDER BY stars DESC
LIMIT %s OFFSET %s;
