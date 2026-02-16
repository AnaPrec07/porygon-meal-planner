"""
Flask configuration from environment (GCP: use Secret Manager to inject vars).
"""
import os
from dotenv import load_dotenv

load_dotenv()


def get_database_uri():
    if os.environ.get("DATABASE_URL"):
        return os.environ["DATABASE_URL"]
    return "postgresql://{user}:{password}@{host}:{port}/{database}".format(
        user=os.environ.get("PGUSER", os.environ.get("DB_USER", "meal_planner")),
        password=os.environ.get("PGPASSWORD", os.environ.get("DB_PASSWORD", "")),
        host=os.environ.get("PGHOST", os.environ.get("DB_HOST", "localhost")),
        port=os.environ.get("PGPORT", os.environ.get("DB_PORT", "5432")),
        database=os.environ.get("PGDATABASE", os.environ.get("DB_NAME", "meal_planner")),
    )


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    SQLALCHEMY_DATABASE_URI = get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_size": 10}

    # Firebase / GCP
    GCLOUD_PROJECT = os.environ.get("GCLOUD_PROJECT") or os.environ.get("GCP_PROJECT") or os.environ.get("FIREBASE_PROJECT_ID")
    FIREBASE_SERVICE_ACCOUNT_JSON = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")  # JSON string

    # Vertex AI (optional)
    VERTEX_AI_ENABLED = os.environ.get("VERTEX_AI_ENABLED", "").lower() in ("true", "1")
    VERTEX_AI_LOCATION = os.environ.get("VERTEX_AI_LOCATION", "us-central1")
    VERTEX_AI_MODEL = os.environ.get("VERTEX_AI_MODEL", "gemini-1.5-flash")
