"""Porygon Meal Planner API - Flask, Firebase Auth, Cloud SQL, optional Vertex AI."""
import os
from datetime import date, datetime
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS

from config import Config
from models import db
from auth_firebase import init_firebase_admin, verify_firebase_token
import database as db_helpers
from ai_service import generate_response as ai_generate_response


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app)
    db.init_app(app)

    with app.app_context():
        db.create_all()

    init_firebase_admin()

    def require_firebase(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get("Authorization")
            token = (auth_header and auth_header.split()[-1]) if auth_header else None
            if not token:
                return jsonify({"error": "Access token required"}), 401
            decoded = verify_firebase_token(token)
            if not decoded:
                return jsonify({"error": "Invalid or expired token"}), 403
            uid, email, name = decoded.get("uid"), decoded.get("email"), decoded.get("name")
            user = db_helpers.get_or_create_user_by_firebase_uid(uid, email, name)
            request.current_user = {"userId": user["id"], "email": user["email"], "name": user["name"]}
            return f(*args, **kwargs)

        return decorated

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat() + "Z"})

    @app.route("/api/auth/session", methods=["POST"])
    def session():
        data = request.get_json() or {}
        id_token = data.get("token") or data.get("idToken")
        if not id_token and request.headers.get("Authorization"):
            id_token = request.headers["Authorization"].split()[-1]
        if not id_token:
            return jsonify({"error": "ID token required"}), 400
        decoded = verify_firebase_token(id_token)
        if not decoded:
            return jsonify({"error": "Invalid or expired token"}), 403
        name = data.get("name") or decoded.get("name")
        user = db_helpers.get_or_create_user_by_firebase_uid(decoded["uid"], decoded.get("email"), name)
        return jsonify({"user": {"id": user["id"], "email": user["email"], "name": user["name"]}})

    @app.route("/api/auth/me", methods=["GET"])
    @require_firebase
    def auth_me():
        user = db_helpers.get_user_by_id(request.current_user["userId"])
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"user": user})

    @app.route("/api/preferences", methods=["GET"])
    @require_firebase
    def get_preferences():
        prefs = db_helpers.get_preferences(request.current_user["userId"])
        return jsonify({"preferences": prefs})

    @app.route("/api/preferences", methods=["POST"])
    @require_firebase
    def post_preferences():
        db_helpers.upsert_preferences(request.current_user["userId"], request.get_json() or {})
        return jsonify({"success": True, "preferences": request.get_json()})

    @app.route("/api/progress", methods=["POST"])
    @require_firebase
    def post_progress():
        data = request.get_json() or {}
        entry_date = data.get("date") or datetime.utcnow().strftime("%Y-%m-%d")
        db_helpers.add_progress_entry(
            request.current_user["userId"],
            entry_date,
            data.get("meals_logged"),
            data.get("notes"),
        )
        stats = db_helpers.get_stats(request.current_user["userId"])
        today = datetime.utcnow().strftime("%Y-%m-%d")
        last_check = stats.get("last_check_in_date") if stats else None
        new_streak = (stats.get("streak") or 0) if stats else 0
        new_points = (stats.get("points") or 0) + 10 if stats else 10
        if last_check:
            last_d = date.fromisoformat(last_check) if isinstance(last_check, str) else last_check
            today_d = date.fromisoformat(today)
            diff = (today_d - last_d).days
            if diff == 1:
                new_streak = (stats.get("streak") or 0) + 1
            elif diff > 1:
                new_streak = 1
        else:
            new_streak = 1
        db_helpers.update_stats(
            request.current_user["userId"],
            points=new_points,
            streak=new_streak,
            last_check_in_date=today,
        )
        return jsonify({"success": True})

    @app.route("/api/progress", methods=["GET"])
    @require_firebase
    def get_progress():
        entries = db_helpers.get_progress_entries(request.current_user["userId"])
        return jsonify({"entries": entries})

    @app.route("/api/stats", methods=["GET"])
    @require_firebase
    def get_stats():
        stats = db_helpers.get_stats(request.current_user["userId"])
        badges = db_helpers.get_badges(request.current_user["userId"])
        return jsonify({"stats": stats or {"points": 0, "streak": 0}, "badges": badges})

    @app.route("/api/chat", methods=["POST"])
    @require_firebase
    def chat():
        data = request.get_json() or {}
        message = data.get("message", "")
        user_id = request.current_user["userId"]
        preferences = db_helpers.get_preferences(user_id)
        stats = db_helpers.get_stats(user_id)
        recent = db_helpers.get_progress_entries(user_id, 7)
        response = ai_generate_response(
            message=message,
            user_id=user_id,
            preferences=preferences or {},
            stats=stats or {},
            recent_progress=recent,
        )
        return jsonify({"response": response})

    @app.route("/api/meal-plans", methods=["POST"])
    @require_firebase
    def post_meal_plans():
        data = request.get_json() or {}
        db_helpers.save_meal_plan(
            request.current_user["userId"],
            data.get("week_start_date"),
            data.get("plan_data"),
        )
        return jsonify({"success": True})

    @app.route("/api/meal-plans", methods=["GET"])
    @require_firebase
    def get_meal_plans():
        week_start = request.args.get("week_start_date")
        plan = db_helpers.get_meal_plan(request.current_user["userId"], week_start)
        return jsonify({"plan": plan})

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "0") == "1")
