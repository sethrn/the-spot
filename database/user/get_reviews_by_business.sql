SELECT r.review_id, r.text, r.useful, r.funny, r.cool, u.name
FROM review r
JOIN yelp_user u ON r.user_id = u.user_id
WHERE r.business_id = %s
ORDER BY r.date DESC;