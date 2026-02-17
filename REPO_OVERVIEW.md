# Porygon Meal Planner — Repository Overview

## High-level summary
A React + Vite frontend with a Flask API backend. Auth is handled by Firebase on the client; the server verifies Firebase ID tokens. Data is stored in PostgreSQL via SQLAlchemy. Chat responses are rule-based with optional Vertex AI (Gemini) integration.

Key entry points:
- Frontend root: [src/main.tsx](src/main.tsx)
- Main UI: [src/app/App.tsx](src/app/App.tsx)
- Auth UI: [src/components/Auth.tsx](src/components/Auth.tsx)
- API client: [src/lib/api.ts](src/lib/api.ts)
- Backend app: [server/app.py](server/app.py)
- Backend models: [server/models.py](server/models.py)
- AI logic: [server/ai_service.py](server/ai_service.py), [server/ai_vertex.py](server/ai_vertex.py)
- Config: [server/config.py](server/config.py)
- PWA shell: [index.html](index.html), [public/manifest.webmanifest](public/manifest.webmanifest)

---

## How the app works (end-to-end flow)

### 1) Authentication
- Client uses Firebase Auth.
- `AuthProvider` listens for auth changes, then calls `api.session()` to create/get an app user record.  
  See [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx), [src/lib/api.ts](src/lib/api.ts).

### 2) User onboarding + preferences
- The chat collects onboarding answers.
- Frontend updates preferences via `api.updatePreferences()` after each user message.
- Backend stores preferences in `user_preferences`.
  See [src/app/App.tsx](src/app/App.tsx), [server/database.py](server/database.py).

### 3) Chat + progress tracking
- Chat is sent to `/api/chat`.
- If message looks like a “check-in” (e.g., contains “ate”), the frontend logs a progress entry via `/api/progress`.
- Backend calculates streak and points on `/api/progress` POST.  
  See [server/app.py](server/app.py), [server/ai_service.py](server/ai_service.py).

### 4) Meal plan, grocery list, inventory
- The UI currently renders mock data for meal plans, grocery list, and inventory.  
  See [src/app/mockData.ts](src/app/mockData.ts), [src/app/App.tsx](src/app/App.tsx).
- Backend has endpoints for `/api/meal-plans`, but the UI does not call them.

---

## Services and dependencies

### Frontend
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Firebase Auth client SDK  
  See [src/lib/firebase.ts](src/lib/firebase.ts)

### Backend
- Flask + Flask-CORS + Flask-SQLAlchemy  
  See [server/app.py](server/app.py), [server/models.py](server/models.py)
- Firebase Admin SDK for token verification  
  See [server/auth_firebase.py](server/auth_firebase.py)
- Optional Vertex AI (Gemini)  
  See [server/ai_vertex.py](server/ai_vertex.py)

### Data store
- PostgreSQL (local or Cloud SQL)  
  Schema in [server/models.py](server/models.py)

### Deployments
- Backend: Cloud Run via [server/Dockerfile](server/Dockerfile)
- Frontend: Firebase Hosting or Cloud Storage + LB  
  See [cloudbuild.yaml](cloudbuild.yaml) and [README.md](README.md)

---

## Data model (backend)
Tables in [server/models.py](server/models.py):
- `users`
- `user_preferences`
- `progress_entries`
- `user_stats`
- `badges`
- `meal_plans`

---

## Issues / risks observed

### Product/feature gaps
1. **Meal plan storage not used by UI**  
   Backend supports `/api/meal-plans`, but UI shows static mock data. This means user-specific plans are not persisted or retrieved.  
   See [src/app/App.tsx](src/app/App.tsx), [src/app/mockData.ts](src/app/mockData.ts), [server/app.py](server/app.py).

2. **Badges are never awarded**  
   There is a `badges` table and the UI expects them, but no server-side logic inserts badges.  
   See [server/database.py](server/database.py), [src/app/App.tsx](src/app/App.tsx).

3. **Inventory and grocery are local-only**  
   Inventory and grocery data is not persisted or synced.  
   See [src/app/App.tsx](src/app/App.tsx), [src/app/mockData.ts](src/app/mockData.ts).

### Data / API concerns
4. **No input validation**  
   Requests accept arbitrary payloads; fields are not validated or sanitized beyond basic type coercion.

5. **Points/streak logic is simplistic**  
   Every progress entry adds +10 points and can reset or increment streak. No protection against multiple entries per day.

6. **Meal plans are appended only**  
   `save_meal_plan` always inserts; there is no upsert or unique constraint.

### Security / ops
7. **CORS is fully open**  
   `CORS(app)` without restrictions is risky in production.

8. **Firebase Admin init can silently fail**  
   If credentials are missing or invalid, it only logs and continues, which can lead to confusing auth failures.

9. **No rate limiting**  
   `/api/chat` could be abused (especially with Vertex AI enabled).

10. **No migrations**  
   `db.create_all()` is used at startup. For production, a migration tool (e.g., Alembic) is safer.

### Docs consistency
11. **README dev note is stale**  
   README says “Backend: Node with watch mode,” but the server is Python/Flask now.  
   See [README.md](README.md).

---

## Suggested next steps (short list)
- Replace mock data with real API calls for meal plans, inventory, and grocery lists.
- Add badge-awarding logic in backend when milestones are reached.
- Add input validation (e.g., Marshmallow or Pydantic-style validation).
- Add rate limiting and CORS restrictions.
- Add migrations (Alembic) and avoid `create_all()` in production.
- Update README to match the Python backend.

---

If you want, I can produce a more detailed architecture diagram or map API routes to UI components.
