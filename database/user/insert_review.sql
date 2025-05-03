INSERT INTO review (review_id, user_id, business_id, stars, text, date, useful, funny, cool)
VALUES (%s, %s, %s, 5, %s, CURRENT_DATE, 0, 0, 0);