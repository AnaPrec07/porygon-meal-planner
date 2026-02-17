"""
ADK Agent: Integartion to GPC native generative AI model.
"""


from google.adk.agents import Agent
from google.adk.tools import ToolContext
from typing import List

# --- Tools

def save_attractions_to_state(
    tool_context: ToolContext,
    attractions: List[str]
) -> dict[str, str]:
    """Saves the list of attractions to state["attractions"].

    Args:
        attractions [str]: a list of strings to add to the list of attractions.

    Returns:
        None
    """
    # Load existing attractions from state. If none exist, start an empty list
    existing_attractions = tool_context.state.get("attractions", [])

    # Update the 'attractions' key with a combo of old and new lists.
    # When the tool is run, ADK will create an event and make
    # corresponding updates in the session's state.
    tool_context.state["attractions"] = existing_attractions + attractions

    # A best practice for tools is to return a status message in a return dict
    return {"status": "success"}


nutritionist = Agent(
    name="nutritionist_agent",
    model="gemini-2.5-flash",
    instruction=(
        "You help the user brainstorm destinations if they don't know where they would like to visit."
    ),
    tools=[save_attractions_to_state]
)


def generate(*, message, preferences=None, stats=None, recent_progress=None):

    preferences = preferences or {}
    try:
        model = nutritionist
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
