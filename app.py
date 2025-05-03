from flask import Flask, render_template, request, jsonify
import psycopg2
from psycopg2.extras import Json
import os

app = Flask(__name__)

USERNAME = "seth" #ENTER whoami VALUE HERE

# === Database Connection ===
def get_db_connection():
    return psycopg2.connect(
        dbname="yelpDB",
        user=USERNAME,
        host="/tmp",
        port=8888,
    )


# === Page Routes (for loading HTML) ===
@app.route("/")
def page_login():
    return render_template("login/login.html")

@app.route("/create-account")
def page_create_account():
    return render_template("login/create_account.html")

@app.route("/manage")
def page_manage_businesses():
    return render_template("manage/view_businesses.html")

@app.route("/manage/details")
def page_business_detail():
    return render_template("manage/business_detail.html")

@app.route("/manage/edit")
def page_edit_business():
    return render_template("manage/edit_business.html")

@app.route("/manage/create")
def page_create_business():
    return render_template("manage/create_business.html")

@app.route("/search")
def page_search():
    return render_template("review/search.html")

@app.route("/search/details")
def page_search_details():
    return render_template("review/business_view.html")

@app.route("/account")
def page_account():
    return render_template("review/account_view.html")


# === API Routes ===

# ===== LOGIN =====
@app.route("/api/login/business", methods=["POST"])
def api_login_business():
    from utils.hash_password import hash_password
    data = request.get_json()

    required_fields = ["username", "password"]
    if not all(field in data for field in required_fields):
        return jsonify(success=False, error="Missing required fields")

    username = data["username"]
    password = hash_password(data["password"])

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        with open("database/login/login_business.sql", "r") as f:
            sql = f.read()
        cur.execute(sql, (username, password))
        result = cur.fetchone()
        cur.close()
        conn.close()

        if result:
            return jsonify(success=True, account_id=result[0])
        else:
            return jsonify(success=False, error="Invalid username or password")

    except Exception as e:
        print("Business login error:", e)
        return jsonify(success=False, error="Internal server error")


@app.route("/api/login/customer", methods=["POST"])
def api_login_customer():
    from utils.hash_password import hash_password
    data = request.get_json()

    required_fields = ["username", "password"]
    if not all(field in data for field in required_fields):
        return jsonify(success=False, error="Missing required fields")

    username = data["username"]
    password = hash_password(data["password"])

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        with open("database/login/login_user.sql", "r") as f:
            sql = f.read()
        cur.execute(sql, (username, password))
        result = cur.fetchone()
        cur.close()
        conn.close()

        if result:
            return jsonify(success=True, user_id=result[0])
        else:
            return jsonify(success=False, error="Invalid username or password")

    except Exception as e:
        print("User login error:", e)
        return jsonify(success=False, error="Internal server error")


@app.route("/api/login/create-business", methods=["POST"])
def api_create_business_account():
    from utils.hash_password import hash_password
    data = request.get_json()

    required_fields = ["username", "password", "name"]
    if not all(field in data for field in required_fields):
        return jsonify(success=False, error="Missing required fields")

    username = data["username"]
    password = hash_password(data["password"])
    name = data["name"]

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        with open("database/login/check_business_user_exists.sql", "r") as f:
            check_sql = f.read()
        cur.execute(check_sql, (username,))
        exists = cur.fetchone()
        if exists:
            cur.close()
            conn.close()
            return jsonify(success=False, error="Username already exists")

        with open("database/login/insert_business_user.sql", "r") as f:
            sql = f.read()
        cur.execute(sql, (name, username, password, username))
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if result and len(result) > 0:
            return jsonify(success=True, account_id=result[0])
        else:
            return jsonify(success=False, error="Username already exists")

    except Exception as e:
        print("Create business error:", e)
        return jsonify(success=False, error="Internal server error")


@app.route("/api/login/create-customer", methods=["POST"])
def api_create_customer_account():
    from utils.hash_password import hash_password
    from utils.generate_user_id import generate_user_id
    data = request.get_json()

    required_fields = ["username", "password", "name"]
    if not all(field in data for field in required_fields):
        return jsonify(success=False, error="Missing required fields")

    username = data["username"]
    password = hash_password(data["password"])
    name = data["name"]
    user_id = generate_user_id()

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        with open("database/login/check_user_exists.sql", "r") as f:
            check_sql = f.read()
        cur.execute(check_sql, (username,))
        exists = cur.fetchone()
        if exists:
            cur.close()
            conn.close()
            return jsonify(success=False, error="Username already exists")


        with open("database/login/insert_user.sql", "r") as f:
            insert_sql = f.read()
        cur.execute(insert_sql, (user_id, name, username, password, username))
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if result and len(result) > 0:
            return jsonify(success=True, user_id=result[0])
        else:
            return jsonify(success=False, error="Account creation failure")
        

    except Exception as e:
        print("Create user error:", e)
        return jsonify(success=False, error="Internal server error")


# ===== BUSINESS ACCOUNT =====
@app.route("/api/businesses", methods=["GET"])
def api_get_my_businesses():
    account_id = request.args.get("accountId")

    if not account_id:
        return jsonify(success=False, error="Missing account ID")

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        with open("database/business/get_my_businesses.sql", "r") as f:
            sql = f.read()

        cur.execute(sql, (account_id,))
        rows = cur.fetchall()

        businesses = []
        for row in rows:
            businesses.append({
                "business_id": row[0],
                "name": row[1],
                "address": row[2],
                "is_open": row[3],
                "stars": row[4]
            })

        cur.close()
        conn.close()

        return jsonify(success=True, businesses=businesses)

    except Exception as e:
        print("Error in get_my_businesses:", e)
        return jsonify(success=False, error="Internal server error")


@app.route("/api/business", methods=["GET"])
def api_get_business():
    account_id = request.args.get("accountId")
    business_id = request.args.get("businessId")

    if not account_id or not business_id:
        return jsonify(success=False, error="Missing parameters")

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        with open("database/business/get_business_by_id.sql", "r") as f:
            sql = f.read()

        cur.execute(sql, (business_id, account_id))
        row = cur.fetchone()

        if not row:
            return jsonify(success=False, error="Business not found")

        colnames = [desc[0] for desc in cur.description]
        details = dict(zip(colnames, row))

        cur.close()
        conn.close()

        return jsonify(success=True, details=details)

    except Exception as e:
        print("Error in get_business:", e)
        return jsonify(success=False, error="Internal server error")



@app.route("/api/business/update", methods=["POST"])
def api_update_business():
    data = request.get_json()
    required_fields = [
        "business_id", "account_id", "name", "address", "city", "state",
        "postal_code", "latitude", "longitude",
        "is_open", "attributes", "categories", "hours"
    ]

    if not all(field in data for field in required_fields):
        return jsonify(success=False, error="Missing fields")

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        with open("database/business/update_business.sql", "r") as f:
            sql = f.read()

        cur.execute(sql, (
            data["name"], data["address"], data["city"], data["state"],
            data["postal_code"], data["latitude"], data["longitude"],
            data["is_open"], Json(data["attributes"]), data["categories"], 
            Json(data["hours"]), data["business_id"], data["account_id"]
        ))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify(success=True)

    except Exception as e:
        print("Error in update_business:", e)
        return jsonify(success=False, error="Internal server error")


@app.route("/api/business/create", methods=["POST"])
def api_create_business():
    from utils.generate_user_id import generate_user_id as gen_biz_id  # reuse for business_id

    data = request.get_json()
    required_fields = [
        "account_id", "name", "address", "city", "state", "postal_code",
        "latitude", "longitude", "is_open",
        "attributes", "categories", "hours"
    ]

    if not all(field in data for field in required_fields):
        return jsonify(success=False, error="Missing fields")

    business_id = gen_biz_id()

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        with open("database/business/create_business.sql", "r") as f:
            insert_sql = f.read()

        cur.execute(insert_sql, (
            business_id, data["name"], data["address"], data["city"], data["state"],
            data["postal_code"], data["latitude"], data["longitude"],
            data["is_open"],Json(data["attributes"]), data["categories"], 
            Json(data["hours"]), data["account_id"]
        ))

        with open("database/business/update_num_businesses.sql", "r") as f:
            update_sql = f.read()

        cur.execute(update_sql, (data["account_id"]))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify(success=True, business_id=business_id)

    except Exception as e:
        print("Error in create_business:", e)
        return jsonify(success=False, error="Internal server error")


# ===== USER ACCOUNT =====
@app.route("/api/search", methods=["POST"])
def api_search_businesses():
    data = request.get_json()

    name = data.get("name")
    state = data.get("state")
    is_open = data.get("is_open")
    page_size = data.get("page_size")
    page = data.get("page")

    print("SQL Params:", name, name, state, state, is_open, is_open, limit, offset)
    print("Types:", [type(p) for p in (name, name, state, state, is_open, is_open, limit, offset)])


    try:
        page_size = int(page_size)
        page = int(page)
        assert page_size > 0 and page >= 0
    except (TypeError, ValueError, AssertionError):
        return jsonify(success=False, error="Invalid pagination parameters")

    offset = page * page_size
    limit = page_size

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        with open("database/user/get_businesses_by_query.sql", "r") as f:
            sql = f.read()

        cur.execute(sql, (name, name, state, state, is_open, is_open, limit, offset))
        rows = cur.fetchall()

        print("Returned rows:", rows)
        for i, row in enumerate(rows):
            print(f"Row {i}:", row)
        colnames = [desc[0] for desc in cur.description]
        results = [dict(zip(colnames, row)) for row in rows]

        cur.close()
        conn.close()

        return jsonify(success=True, businesses=results)

    except Exception as e:
        print("Search error:", e)
        return jsonify(success=False, error="Internal server error")


@app.route("/api/business/review", methods=["POST"])
def api_post_review():
    return jsonify({"success": False})

@app.route("/api/business/tip", methods=["POST"])
def api_post_tip():
    return jsonify({"success": False})

@app.route("/api/business/tip-praise", methods=["POST"])
def api_praise_tip():
    return jsonify({"success": False})

@app.route("/api/business/review-reaction", methods=["POST"])
def api_review_reaction():
    return jsonify({"success": False})

@app.route("/api/account", methods=["GET"])
def api_get_account():
    return jsonify({"info": {}})


# === Run the app ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
