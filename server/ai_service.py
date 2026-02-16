"""
AI service - rule-based coach + optional Vertex AI (Gemini). Python port of ai-service.js.
"""
import random
from ai_vertex import is_enabled, generate as vertex_generate

ENCOURAGING_MESSAGES = [
    "You're doing amazing! 💪✨",
    "Every step forward counts! 🌟",
    "I'm so proud of your progress! 🎉",
    "You've got this! Keep going! 💚",
    "Your dedication is inspiring! 🌈",
    "Small changes lead to big results! 🚀",
    "You're building healthier habits every day! 🌱",
]

HEALTHIER_ALTERNATIVES = {
    "sugar": [
        "Try fresh fruit instead of sugary snacks",
        "Use honey or maple syrup in moderation",
        "Dark chocolate (70%+) satisfies sweet cravings",
        "Frozen grapes are a great sweet treat",
    ],
    "processed": [
        "Choose whole foods over processed options",
        "Prepare meals at home when possible",
        "Read labels and avoid ingredients you can't pronounce",
    ],
    "fast_food": [
        "Meal prep on weekends for quick healthy meals",
        "Keep healthy snacks ready for when hunger strikes",
        "Try making your favorite fast food at home",
    ],
}

TIMELINE_EXPECTATIONS = {
    "week1": "Week 1: You may feel some adjustment as your body adapts to new eating patterns. Stay hydrated!",
    "week2": "Week 2: Many people start noticing increased energy levels and better mood stability.",
    "week3": "Week 3: Your taste buds will start adapting, and you may crave healthier foods naturally.",
    "week4": "Week 4: Congratulations! You'll hit your first month milestone - a huge achievement!",
    "month2": "Month 2: You'll likely see more consistent energy and improved sleep quality.",
    "month3": "Month 3: Your new habits will feel more automatic, and you'll see clearer progress toward your goals.",
}


def generate_response(*, message, user_id, preferences=None, stats=None, recent_progress=None):
    preferences = preferences or {}
    stats = stats or {}
    recent_progress = recent_progress or []

    if is_enabled():
        out = vertex_generate(
            message=message,
            preferences=preferences,
            stats=stats,
            recent_progress=recent_progress,
        )
        if out:
            return out

    lower = message.lower().strip()
    onboarding_complete = preferences.get("onboarding_complete")

    if not onboarding_complete:
        return _handle_onboarding_flow(message, preferences)
    if _is_check_in_message(lower):
        return _handle_check_in(message, stats, recent_progress)
    if any(x in lower for x in ("what did i eat", "what did you eat", "track", "log")):
        return _handle_progress_tracking(stats, recent_progress)
    if any(x in lower for x in ("expect", "timeline", "when will", "how long")):
        return _handle_timeline_expectations(stats, preferences)
    if any(x in lower for x in ("alternative", "instead of", "healthier", "bad habit")):
        return _handle_healthier_alternatives(preferences)
    if any(x in lower for x in ("motivate", "encourage", "inspiration", "feeling down")):
        return _handle_encouragement(stats, preferences)
    if any(x in lower for x in ("meal plan", "meal", "what should i eat", "menu")):
        return _handle_meal_plan_request(preferences)
    if any(x in lower for x in ("grocery", "shopping", "list")):
        return (
            "Perfect! I've prepared your grocery list for this week! 🛒\n\n"
            "Head to the 'Grocery List' tab to see everything organized by category. "
            "I've calculated the exact quantities you need for your meal plan, so there's no waste. "
            "You can check off items as you shop!\n\n"
            "Pro tip: Shopping on Sunday or Monday can help you prep for the week ahead!"
        )
    if any(x in lower for x in ("progress", "reward", "badge", "streak")):
        return _handle_progress_and_rewards(stats)
    if any(x in lower for x in ("help", "what can you", "support")):
        return _handle_help_message()

    encouraging = random.choice(ENCOURAGING_MESSAGES)
    return (
        f"{encouraging}\n\nI'm here to help you with:\n\n"
        "• Creating personalized meal plans\n• Tracking your progress\n"
        "• Providing motivation and support\n• Answering questions about your health journey\n\n"
        "What would you like to focus on today? 😊"
    )


def _handle_onboarding_flow(message, preferences):
    lower = message.lower()
    questions = [
        ("food_allergies", "Let's start! Do you have any food allergies I should know about? (e.g., nuts, dairy, shellfish)"),
        ("foods_dislike", "Got it! Are there any foods you really don't like? This helps me create meal plans you'll actually enjoy! 😊"),
        ("foods_like", "Perfect! Now, what are some of your favorite foods? I'll make sure to include them in your meal plans!"),
        ("meals_per_day", "Great! How many meals do you typically eat per day? (including snacks - e.g., 3 meals + 2 snacks = 5)"),
        ("meal_preference", "Awesome! Do you prefer quick meals (15 min or less) or are you okay with cooked meals that take longer? (quick/cooked/both)"),
        ("goals", "Excellent! What are your main health goals? (e.g., brain focus, weight loss, muscle tone, hormone balance, general wellness)"),
        ("bad_habits", "I understand! What are some habits you'd like to gradually change? (e.g., reducing sugar, eating less processed food, more vegetables)"),
        ("body_scan_info", "Last question! If you have any body scan information or health metrics you'd like me to consider, please share them. Otherwise, just say 'skip'!"),
    ]
    current_step = 0
    for i, (key, _) in enumerate(questions):
        if not preferences.get(key):
            current_step = i
            break
    else:
        current_step = len(questions)

    if current_step == len(questions):
        return "🎉 Amazing! I have everything I need to create your personalized meal plan. Let's get started on your health journey together! You can ask me about meal plans, track your progress, or get support anytime. How can I help you today?"
    if "skip" in lower and current_step == len(questions) - 1:
        return "Perfect! I have enough information to get started. Let's begin your health journey! 🚀\n\nYou can ask me about meal plans, track your progress, or get support anytime. How can I help you today?"
    _, question = questions[current_step]
    if current_step == 0:
        return f"{question}\n\n(You can say \"none\" if you don't have any allergies)"
    return question


def _is_check_in_message(message):
    return (
        "ate" in message or "had" in message
        or "breakfast" in message or "lunch" in message or "dinner" in message or "snack" in message
        or "check in" in message or "check-in" in message
    )


def _handle_check_in(message, stats, recent_progress):
    encouraging = random.choice(ENCOURAGING_MESSAGES)
    streak = stats.get("streak", 0) or 0
    resp = f"{encouraging}\n\nThanks for checking in! I've logged your meals. "
    if streak > 0:
        resp += f"You're on a {streak}-day streak - that's incredible! 🌟\n\n"
    resp += "Keep tracking your meals to see your progress. Would you like me to:\n• Create a meal plan for the week?\n• Suggest healthier alternatives?\n• Show you your progress?"
    return resp


def _handle_progress_tracking(stats, recent_progress):
    streak = stats.get("streak", 0) or 0
    points = stats.get("points", 0) or 0
    resp = f"Here's your progress! 📊\n\n🌟 Points: {points}\n🔥 Streak: {streak} days\n\n"
    if recent_progress:
        resp += "Recent check-ins:\n"
        for entry in recent_progress[:5]:
            d = entry.get("date", "")
            meals = entry.get("meals_logged") or "Logged meals"
            resp += f"• {d}: {meals}\n"
    else:
        resp += "Start tracking your meals to see your progress here!"
    return resp


def _handle_timeline_expectations(stats, preferences):
    streak = stats.get("streak", 0) or 0
    week = streak // 7 + 1
    resp = "Great question! Here's what you can expect: 📅\n\n"
    if week == 1:
        resp += TIMELINE_EXPECTATIONS["week1"] + "\n\n"
    elif week == 2:
        resp += TIMELINE_EXPECTATIONS["week2"] + "\n\n"
    elif week == 3:
        resp += TIMELINE_EXPECTATIONS["week3"] + "\n\n"
    elif week == 4:
        resp += TIMELINE_EXPECTATIONS["week4"] + "\n\n"
    elif week >= 8:
        resp += TIMELINE_EXPECTATIONS["month2"] + "\n\n"
    elif week >= 12:
        resp += TIMELINE_EXPECTATIONS["month3"] + "\n\n"
    resp += f"You're currently on day {streak} of your journey. Keep going - you're doing great! 💪"
    return resp


def _handle_healthier_alternatives(preferences):
    bad_habits = (preferences.get("bad_habits") or "").lower()
    resp = "I'm here to help you make gradual, sustainable changes! 🌱\n\n"
    if "sugar" in bad_habits:
        resp += "For reducing sugar:\n"
        for alt in HEALTHIER_ALTERNATIVES["sugar"]:
            resp += f"• {alt}\n"
        resp += "\n"
    if "processed" in bad_habits:
        resp += "For avoiding processed foods:\n"
        for alt in HEALTHIER_ALTERNATIVES["processed"]:
            resp += f"• {alt}\n"
        resp += "\n"
    if "fast food" in bad_habits or "fast-food" in bad_habits:
        resp += "For reducing fast food:\n"
        for alt in HEALTHIER_ALTERNATIVES["fast_food"]:
            resp += f"• {alt}\n"
        resp += "\n"
    resp += "Remember: gradual change is sustainable change. We'll work on this together, one step at a time! 💚"
    return resp


def _handle_encouragement(stats, preferences):
    encouraging = random.choice(ENCOURAGING_MESSAGES)
    streak = stats.get("streak", 0) or 0
    resp = f"{encouraging}\n\nEvery healthy choice you make is an investment in your future self. "
    if streak > 0:
        resp += f"Your {streak}-day streak shows real commitment, and I'm so proud of you! "
    resp += "\n\nRemember: progress isn't always linear, but consistency is key. "
    resp += "You've already proven you have what it takes by showing up every single day.\n\n"
    resp += "Your body is getting stronger, your habits are becoming automatic, "
    resp += "and you're building a healthier, happier you. Keep going - you've got this! 🌟"
    return resp


def _handle_meal_plan_request(preferences):
    resp = "I've created a delicious and balanced meal plan for you! 🍽️\n\nCheck out the 'Meal Plan' tab to see your weekly menu. "
    if preferences.get("foods_like"):
        resp += f"I've included your favorite foods ({preferences['foods_like']}) "
    if preferences.get("food_allergies"):
        resp += f"and made sure to avoid your allergies ({preferences['food_allergies']}). "
    resp += "Each meal is designed to provide optimal nutrition while being easy to prepare. Would you like me to adjust anything?"
    return resp


def _handle_progress_and_rewards(stats):
    streak = stats.get("streak", 0) or 0
    points = stats.get("points", 0) or 0
    resp = f"You're crushing it! 🌟\n\nYou've earned {points} points and maintained a {streak}-day streak - that's incredible! "
    if streak >= 7:
        resp += "You've unlocked the 'Consistency King' badge! 🏆\n\n"
    resp += "Keep going and you'll unlock more badges! Your dedication is truly inspiring. What would you like to focus on this week?"
    return resp


def _handle_help_message():
    return (
        "I'm here to make your nutrition journey easy and fun! Here's what I can do for you:\n\n"
        "🍽️ Create personalized meal plans\n🛒 Generate organized grocery lists\n"
        "📊 Track your progress & goals\n🏆 Celebrate your wins with rewards\n"
        "📅 Show you what to expect in upcoming weeks\n💪 Provide motivation and support\n"
        "🌱 Suggest healthier alternatives to bad habits\n📝 Check in with you about your meals\n\n"
        "Just ask me anything! Whether you need a new meal plan, want to check your progress, "
        "or need some encouragement - I'm here for you!"
    )
