"""
Vertex AI (Gemini) integration - GCP native. Python port of ai-vertex.js.
"""
import os

VERTEX_AI_ENABLED = os.environ.get("VERTEX_AI_ENABLED", "").lower() in ("true", "1")
PROJECT_ID = os.environ.get("GCLOUD_PROJECT") or os.environ.get("GCP_PROJECT")
LOCATION = os.environ.get("VERTEX_AI_LOCATION", "us-central1")
MODEL = os.environ.get("VERTEX_AI_MODEL", "gemini-1.5-flash")


def is_enabled():
    return bool(VERTEX_AI_ENABLED and PROJECT_ID)


def generate(*, message, preferences=None, stats=None, recent_progress=None):
    if not is_enabled():
        return None
    preferences = preferences or {}
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel

        vertexai.init(project=PROJECT_ID, location=LOCATION)
        model = GenerativeModel(MODEL)
        context_parts = [
            "You are a friendly nutrition coach for the Porygon Meal Planner app.",
            "Keep responses concise, supportive, and practical.",
        ]
        if not preferences.get("onboarding_complete"):
            context_parts.append("The user is in onboarding; help collect preferences.")
        if stats:
            context_parts.append(f"User stats: {stats.get('points', 0)} points, {stats.get('streak', 0)} day streak.")
        if recent_progress:
            context_parts.append(f"Recent check-ins: {recent_progress[:5]!r}")
        context = "\n".join(context_parts)
        prompt = f"{context}\n\nUser: {message}\nCoach:"
        response = model.generate_content(prompt)
        if response and response.candidates and response.candidates[0].content.parts:
            return response.candidates[0].content.parts[0].text.strip()
    except Exception as e:
        print(f"Vertex AI fallback: {e}")
    return None
