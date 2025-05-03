INSERT INTO tip (user_id, business_id, text, date, praise_count)
VALUES (%s, %s, %s, CURRENT_DATE, 0);