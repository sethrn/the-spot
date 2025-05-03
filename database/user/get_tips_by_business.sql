SELECT t.tip_id, t.text, t.praise_count, u.name
FROM tip t
JOIN yelp_user u ON t.user_id = u.user_id
WHERE t.business_id = %s
ORDER BY t.date DESC;