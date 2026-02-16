# Flask (Python) Backend Migration

This document describes all changes made to replace the Node.js/Express backend with a **Python Flask** backend while keeping the same API contract and GCP-native setup (Firebase Auth, Cloud SQL, Vertex AI).

---

## 1. Task Overview

**Goal:** Use Python frameworks (Flask) as much as possible for the backend.

**Approach:**

- Replace the entire Node.js API server with a **Flask** application.
- Use **Flask-SQLAlchemy** for the database layer (Cloud SQL PostgreSQL) instead of raw `pg` in Node.
- Port Firebase Admin token verification, AI (rule-based + Vertex AI), and all route logic to Python.
- Keep the same HTTP API so the existing React frontend works without changes.
- Use Python best practices: `python-dotenv` for config, `gunicorn` for production, virtualenv-friendly `requirements.txt`.

**Pros:**

- Single language (Python) for backend; easier to maintain if the team prefers Python.
- Flask is lightweight and widely used; SQLAlchemy gives a clear ORM and migration path.
- Same GCP services (Firebase, Cloud SQL, Vertex AI) with official Python SDKs.

**Cons:**

- Node backend and any Node-specific tooling in `server/` were removed; no option to run the previous stack from this repo without reverting.

---

## 2. Project State Before (Node Backend)

- **server/server.js** – Express app: Firebase auth middleware, routes for `/api/auth/session`, `/api/auth/me`, `/api/preferences`, `/api/progress`, `/api/stats`, `/api/chat`, `/api/meal-plans`, `/api/health`.
- **server/database-pg.js** – PostgreSQL with `pg`; schema init and async helpers (getOrCreateUserByFirebaseUid, getPreferences, upsertPreferences, progress, stats, badges, meal plans).
- **server/auth-firebase.js** – Firebase Admin init and `verifyIdToken`.
- **server/ai-service.js** – Rule-based coach + optional Vertex AI call.
- **server/ai-vertex.js** – Vertex AI (Gemini) integration.
- **server/package.json** – Node dependencies (express, cors, pg, firebase-admin, dotenv, @google-cloud/vertexai).
- **server/Dockerfile** – Node 20 image, `node server.js`.

---

## 3. Changes Made (Summary)

| Area | Before (Node) | After (Python/Flask) |
|------|----------------|----------------------|
| **Entrypoint** | `server.js` (Express) | `app.py` (Flask) |
| **Config** | `dotenv` + `process.env` | `config.py` + `python-dotenv`, `Config` class |
| **DB** | `pg` + raw SQL in `database-pg.js` | Flask-SQLAlchemy + `models.py`, helpers in `database.py` |
| **Auth** | `auth-firebase.js` (Firebase Admin) | `auth_firebase.py` (firebase-admin Python SDK) |
| **AI** | `ai-service.js` + `ai-vertex.js` | `ai_service.py` + `ai_vertex.py` (google-cloud-aiplatform) |
| **Routes** | Express `app.get/post(..., handler)` | Flask `@app.route` + `@require_firebase` decorator |
| **Dependencies** | `package.json` (Node) | `requirements.txt` (Python) |
| **Run** | `npm run server` → `node server.js` | `npm run server` → `cd server && python app.py` |
| **Docker** | Node 20, `node server.js` | Python 3.11, `gunicorn app:app` |

---

## 4. File-by-File Changes and Thought Process

### 4.1 New Python Files

#### **server/requirements.txt**

- **Purpose:** Python dependency list for the Flask backend.
- **Contents:** flask, flask-cors, flask-sqlalchemy, sqlalchemy, psycopg2-binary, python-dotenv, firebase-admin, google-cloud-aiplatform.
- **Thought process:** Only what’s needed for the API; no Node packages.

#### **server/config.py**

- **Purpose:** Central config from environment (GCP: vars can be injected via Secret Manager).
- **Contents:** `get_database_uri()` (from `DATABASE_URL` or `PG*`/`DB_*`), `Config` class with `SQLALCHEMY_DATABASE_URI`, Firebase project and service account vars, Vertex AI flags and model/location.
- **Thought process:** One place for all env-based config; Flask `app.config.from_object(Config)`.

#### **server/models.py**

- **Purpose:** SQLAlchemy models matching the existing PostgreSQL schema so we don’t require a separate migration step for tables.
- **Contents:** `User`, `UserPreference`, `ProgressEntry`, `UserStat`, `Badge`, `MealPlan` with the same table and column names as in the Node schema (e.g. `users.firebase_uid`, `user_preferences.onboarding_complete`). Uses `db = SQLAlchemy()` and `server_default=func.now()` for timestamps.
- **Thought process:** ORM improves readability and future migrations; same column names keep compatibility with existing DBs.

#### **server/database.py**

- **Purpose:** Application-level DB helpers used by routes (same logical API as the Node `dbHelpers`).
- **Contents:** `get_or_create_user_by_firebase_uid`, `get_user_by_id`, `get_preferences`, `upsert_preferences`, `add_progress_entry`, `get_progress_entries`, `get_stats`, `initialize_stats`, `update_stats`, `get_badges`, `save_meal_plan`, `get_meal_plan`. All use the models and `db.session`; date/JSON handling (e.g. `plan_data` as JSON string) aligned with the previous API.
- **Thought process:** Routes stay thin; all DB logic in one module; string/date conversion for requests and responses.

#### **server/auth_firebase.py**

- **Purpose:** Initialize Firebase Admin and verify Firebase ID tokens (Python port of `auth-firebase.js`).
- **Contents:** `init_firebase_admin()` (uses `FIREBASE_SERVICE_ACCOUNT_JSON` or `GCLOUD_PROJECT`/ADC), `verify_firebase_token(id_token)` returning `{ uid, email, name }` or None.
- **Thought process:** Same behavior as Node; Python Firebase Admin SDK supports the same credential options.

#### **server/ai_vertex.py**

- **Purpose:** Optional Vertex AI (Gemini) for chat (Python port of `ai-vertex.js`).
- **Contents:** `is_enabled()` (from `VERTEX_AI_ENABLED` and project id), `generate(message=..., preferences=..., stats=..., recent_progress=...)` using `vertexai` and `GenerativeModel` from `google-cloud-aiplatform`. Returns generated text or None on failure (fallback to rule-based).
- **Thought process:** Same “try Vertex AI first, else rule-based” behavior as in Node.

#### **server/ai_service.py**

- **Purpose:** Rule-based nutrition coach + optional Vertex AI (Python port of `ai-service.js`).
- **Contents:** Same constants (ENCOURAGING_MESSAGES, HEALTHIER_ALTERNATIVES, TIMELINE_EXPECTATIONS) and flow: if Vertex AI enabled and returns something, use it; else run rule-based handlers (onboarding, check-in, progress, timeline, alternatives, encouragement, meal plan, grocery, progress/rewards, help, default). All helper functions ported to Python (`_handle_onboarding_flow`, `_handle_check_in`, etc.).
- **Thought process:** Behavior and copy kept identical so user experience doesn’t change.

#### **server/app.py**

- **Purpose:** Flask application and all HTTP routes.
- **Contents:**
  - `create_app(config_class=Config)`: Flask app, CORS, `db.init_app(app)`, `db.create_all()` in app context, `init_firebase_admin()`.
  - `require_firebase` decorator: reads `Authorization: Bearer <token>`, calls `verify_firebase_token`, then `get_or_create_user_by_firebase_uid`, attaches `request.current_user`.
  - Routes: `GET /api/health`; `POST /api/auth/session` (body: token/name); `GET /api/auth/me`; `GET/POST /api/preferences`; `POST/GET /api/progress` (including streak/points update); `GET /api/stats`; `POST /api/chat`; `POST/GET /api/meal-plans`. All protected routes use `@require_firebase`; responses use `jsonify(...)` with the same shapes as the Node API.
  - `if __name__ == "__main__": app.run(host="0.0.0.0", port=PORT)`.
- **Thought process:** Single app factory for clarity; decorator for DRY auth; response format unchanged for the frontend.

---

### 4.2 Removed Node Files

- **server/server.js** – Replaced by `app.py`.
- **server/database-pg.js** – Replaced by `models.py` + `database.py`.
- **server/auth-firebase.js** – Replaced by `auth_firebase.py`.
- **server/ai-service.js** – Replaced by `ai_service.py`.
- **server/ai-vertex.js** – Replaced by `ai_vertex.py`.
- **server/package.json** – No longer used; backend is Python-only. Root `package.json` still has frontend and `npm run server` script.

**Thought process:** Avoid maintaining two backends; remove Node API code so the repo clearly points to Flask.

---

### 4.3 Modified Files

#### **server/Dockerfile**

- **Before:** Node 20 image, `npm ci`, `node server.js`.
- **After:** Python 3.11-slim, `pip install -r requirements.txt` and gunicorn, `CMD` runs gunicorn bound to `0.0.0.0:${PORT:-3001}` so Cloud Run can set `PORT`.
- **Thought process:** Backend is Python; gunicorn is the standard production WSGI server for Flask.

#### **package.json (root)**

- **Before:** `"server": "cd server && npm run dev"`, `"server:start": "cd server && npm start"`.
- **After:** `"server": "cd server && python app.py"`, `"server:start": "cd server && gunicorn -b 0.0.0.0:3001 app:app"`.
- **Thought process:** One command to run the Flask app locally; production command uses gunicorn (PORT can be overridden via env when needed).

#### **README.md**

- **Updates:** Tech stack now says “Backend: Python, Flask”; install instructions use `pip install -r requirements.txt` and suggest a virtualenv; run instructions use `python app.py`; project structure lists the new Python files and removes Node server file names.
- **Thought process:** Docs should match the current stack so new contributors use Flask and Python.

---

## 5. API Contract (Unchanged)

The frontend still calls the same endpoints with the same request/response shapes:

- `POST /api/auth/session` – body `{ token, name? }` → `{ user: { id, email, name } }`
- `GET /api/auth/me` – Bearer token → `{ user }`
- `GET /api/preferences` → `{ preferences }`
- `POST /api/preferences` – body preferences → `{ success, preferences }`
- `POST /api/progress` – body `{ date?, meals_logged?, notes? }` → `{ success: true }`
- `GET /api/progress` → `{ entries }`
- `GET /api/stats` → `{ stats, badges }`
- `POST /api/chat` – body `{ message }` → `{ response }`
- `POST /api/meal-plans` – body `{ week_start_date, plan_data }` → `{ success: true }`
- `GET /api/meal-plans?week_start_date=...` → `{ plan }`
- `GET /api/health` → `{ status, timestamp }`

No frontend code changes were required.

---

## 6. Environment Variables (Same as Before)

- **Server:** `PORT`, `DATABASE_URL` or `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`, `GCLOUD_PROJECT`, `FIREBASE_SERVICE_ACCOUNT_JSON` (or `GOOGLE_APPLICATION_CREDENTIALS`), optional `VERTEX_AI_ENABLED`, `VERTEX_AI_LOCATION`, `VERTEX_AI_MODEL`.
- **Frontend:** Unchanged (`VITE_API_URL`, `VITE_FIREBASE_*`).

---

## 7. How to Run

- **Local:** From repo root, `npm run server` (runs `cd server && python app.py`). Ensure Python 3.11+ and a virtualenv; `pip install -r server/requirements.txt`; set `server/.env` (Postgres, Firebase, optional Vertex AI).
- **Production (e.g. Cloud Run):** Build the image from the `server/` context using the new Dockerfile; run with gunicorn; set env (or Secret Manager) for DB and Firebase. Same as before, with a Python container instead of Node.

This completes the migration to a Flask (Python) backend with the same API and GCP-native design.
