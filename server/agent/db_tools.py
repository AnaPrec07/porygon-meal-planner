"""DB helpers using Flask-SQLAlchemy models."""
import json
from datetime import date
from models import db, User, UserPreference, ProgressEntry, UserStat, Badge, MealPlan


def get_or_create_user_by_firebase_uid(firebase_uid, email, name=None):
    user = User.query.filter_by(firebase_uid=firebase_uid).first()
    if user:
        return {"id": user.id, "email": user.email, "name": user.name}
    user = User(firebase_uid=firebase_uid, email=email or "", name=name)
    db.session.add(user)
    db.session.commit()
    initialize_stats(user.id)
    return {"id": user.id, "email": user.email, "name": user.name}


def get_user_by_id(user_id):
    user = User.query.get(user_id)
    if not user:
        return None
    return {"id": user.id, "email": user.email, "name": user.name}


def get_preferences(user_id):
    pref = UserPreference.query.filter_by(user_id=user_id).first()
    return (
        None
        if not pref
        else {
            "id": pref.id,
            "user_id": pref.user_id,
            "food_allergies": pref.food_allergies,
            "foods_dislike": pref.foods_dislike,
            "foods_like": pref.foods_like,
            "meals_per_day": pref.meals_per_day,
            "meal_preference": pref.meal_preference,
            "goals": pref.goals,
            "bad_habits": pref.bad_habits,
            "body_scan_info": pref.body_scan_info,
            "onboarding_complete": pref.onboarding_complete,
        }
    )


def upsert_preferences(user_id, preferences):
    pref = UserPreference.query.filter_by(user_id=user_id).first()
    if pref:
        pref.food_allergies = preferences.get("food_allergies") or None
        pref.foods_dislike = preferences.get("foods_dislike") or None
        pref.foods_like = preferences.get("foods_like") or None
        pref.meals_per_day = preferences.get("meals_per_day")
        pref.meal_preference = preferences.get("meal_preference") or None
        pref.goals = preferences.get("goals") or None
        pref.bad_habits = preferences.get("bad_habits") or None
        pref.body_scan_info = preferences.get("body_scan_info") or None
        pref.onboarding_complete = bool(preferences.get("onboarding_complete"))
    else:
        pref = UserPreference(
            user_id=user_id,
            food_allergies=preferences.get("food_allergies"),
            foods_dislike=preferences.get("foods_dislike"),
            foods_like=preferences.get("foods_like"),
            meals_per_day=preferences.get("meals_per_day"),
            meal_preference=preferences.get("meal_preference"),
            goals=preferences.get("goals"),
            bad_habits=preferences.get("bad_habits"),
            body_scan_info=preferences.get("body_scan_info"),
            onboarding_complete=bool(preferences.get("onboarding_complete")),
        )
        db.session.add(pref)
    db.session.commit()


def add_progress_entry(user_id, entry_date, meals_logged=None, notes=None):
    if isinstance(entry_date, str):
        entry_date = date.fromisoformat(entry_date)
    entry = ProgressEntry(user_id=user_id, date=entry_date, meals_logged=meals_logged, notes=notes)
    db.session.add(entry)
    db.session.commit()


def get_progress_entries(user_id, limit=30):
    entries = ProgressEntry.query.filter_by(user_id=user_id).order_by(ProgressEntry.date.desc()).limit(limit).all()
    return [{"id": e.id, "user_id": e.user_id, "date": e.date.isoformat() if e.date else None, "meals_logged": e.meals_logged, "notes": e.notes} for e in entries]


def get_stats(user_id):
    stat = UserStat.query.filter_by(user_id=user_id).first()
    if not stat:
        return None
    return {
        "points": stat.points,
        "streak": stat.streak,
        "last_check_in_date": stat.last_check_in_date.isoformat() if stat.last_check_in_date else None,
    }


def initialize_stats(user_id):
    if UserStat.query.filter_by(user_id=user_id).first():
        return
    db.session.add(UserStat(user_id=user_id))
    db.session.commit()


def update_stats(user_id, points=None, streak=None, last_check_in_date=None):
    stat = UserStat.query.filter_by(user_id=user_id).first()
    if not stat:
        initialize_stats(user_id)
        stat = UserStat.query.filter_by(user_id=user_id).first()
    if points is not None:
        stat.points = points
    if streak is not None:
        stat.streak = streak
    if last_check_in_date is not None:
        stat.last_check_in_date = last_check_in_date if isinstance(last_check_in_date, date) else date.fromisoformat(last_check_in_date)
    db.session.commit()


def get_badges(user_id):
    badges = Badge.query.filter_by(user_id=user_id).order_by(Badge.earned_at.desc()).all()
    return [{"id": b.id, "user_id": b.user_id, "badge_name": b.badge_name, "badge_description": b.badge_description, "earned_at": b.earned_at.isoformat() if b.earned_at else None} for b in badges]


def save_meal_plan(user_id, week_start_date, plan_data):
    if isinstance(week_start_date, str):
        week_start_date = date.fromisoformat(week_start_date)
    plan_data_str = json.dumps(plan_data) if isinstance(plan_data, (dict, list)) else plan_data
    plan = MealPlan(user_id=user_id, week_start_date=week_start_date, plan_data=plan_data_str)
    db.session.add(plan)
    db.session.commit()


def get_meal_plan(user_id, week_start_date):
    if isinstance(week_start_date, str):
        week_start_date = date.fromisoformat(week_start_date)
    plan = (
        MealPlan.query.filter_by(user_id=user_id, week_start_date=week_start_date)
        .order_by(MealPlan.created_at.desc())
        .first()
    )
    if not plan:
        return None
    data = json.loads(plan.plan_data)
    return {"id": plan.id, "user_id": plan.user_id, "week_start_date": plan.week_start_date.isoformat(), "plan_data": data, "created_at": plan.created_at}
