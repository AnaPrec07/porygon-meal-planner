
import os

from flask import Flask

from server.config import Config
from server.models import db
# --- Server-rendered HTML routes ---
from flask import render_template, request, redirect, url_for, session
from flask_login import UserMixin, login_user, login_manager,login_required, logout_user, current_user


def create_app(config_class=Config):
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config.from_object(config_class)
    db.init_app(app)

    with app.app_context():
        db.create_all()

    return app

app = create_app()


# Mock data for demonstration
DEFAULT_GROCERY_ITEMS = [
    {"id": "1", "name": "Spinach", "quantity": "1 bunch", "category": "Vegetables"},
    {"id": "2", "name": "Chicken breast", "quantity": "1.5 lbs", "category": "Protein"},
    {"id": "3", "name": "Greek yogurt", "quantity": "32 oz", "category": "Dairy"},
]
DEFAULT_INVENTORY_ITEMS = [
    {"id": "inv1", "name": "Chicken breast", "quantity": 2, "unit": "lbs", "category": "Protein", "plannedQuantity": 2},
    {"id": "inv2", "name": "Spinach", "quantity": 1, "unit": "bunch", "category": "Vegetables", "plannedQuantity": 1},
]
DEFAULT_WEEKLY_MEAL_PLAN = [
    {
        "day": "Monday",
        "meals": [
            {
                "id": "m1",
                "name": "Greek Yogurt with Berries",
                "time": "Breakfast",
                "calories": 280,
                "prepTime": "5 min",
                "ingredients": ["Greek yogurt", "mixed berries", "honey", "granola"],
            },
        ],
    },
]
WEEKLY_GOALS = [
    {"id": "1", "title": "Meals tracked", "progress": 5, "total": 7},
    {"id": "2", "title": "Water (glasses)", "progress": 12, "total": 14},
]
UPCOMING_MILESTONES = [
    "Week 2: Increased energy",
    "Week 3: Taste buds adapting",
    "Week 4: First month milestone",
]

@app.route("/")
def test():
    return render_template("test_home.html")


@app.route("/chat", methods=["GET", "POST"])
def chat():
    if "messages" not in session:
        session["messages"] = []
    if request.method == "POST":
        message = request.form.get("message")
        if message:
            session["messages"].append({"role": "user", "content": message})
            # For demo, echo back a canned response
            session["messages"].append({"role": "assistant", "content": "Thanks for your message! (AI response would go here)"})
    return render_template("chat.html", messages=session.get("messages", []))

@app.route("/meal-plan")
def meal_plan():
    return render_template("meal_plan.html", meal_plan=DEFAULT_WEEKLY_MEAL_PLAN)

@app.route("/grocery")
def grocery():
    # Group by category
    grocery_by_category = {}
    for item in DEFAULT_GROCERY_ITEMS:
        grocery_by_category.setdefault(item["category"], []).append(item)
    return render_template("grocery.html", grocery_by_category=grocery_by_category)

@app.route("/inventory")
def inventory():
    inventory_by_category = {}
    for item in DEFAULT_INVENTORY_ITEMS:
        inventory_by_category.setdefault(item["category"], []).append(item)
    return render_template("inventory.html", inventory_by_category=inventory_by_category)

@app.route("/rewards")
def rewards():
    stats = {"points": 100, "streak": 5}
    badges = [
        {"badge_name": "Consistency King", "badge_description": "7-day streak!", "earned_at": "2026-02-10"},
    ]
    return render_template("rewards.html", stats=stats, badges=badges)


# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 3001))
#     app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "0") == "1")
# 