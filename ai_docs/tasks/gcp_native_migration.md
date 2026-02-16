# GCP Native Migration – Porygon Meal Planner

This document describes all code and configuration changes made to make the Porygon Meal Planner repository **fully GCP native**, along with the reasoning behind each decision.

---

## 1. Task Overview

**Goal:** Change the codebase to leverage Google Cloud Platform (GCP) services and GCP best practices so the application is **completely GCP native**.

**Approach:**

- **Authentication:** Replace custom JWT (backend-issued) with **Firebase Authentication**. The frontend signs in with Firebase; the backend only verifies Firebase ID tokens and maps them to app users.
- **Database:** Replace **SQLite** with **Cloud SQL (PostgreSQL)** for production-ready, managed relational data.
- **Compute:** Design the backend for **Cloud Run** (containerized, serverless) with a **Dockerfile** and sample **Cloud Build** pipeline.
- **AI:** Keep the existing rule-based coach and add an optional **Vertex AI (Gemini)** path for richer chat when configured.
- **Secrets:** Use environment variables that can be populated from **Secret Manager** in Cloud Run (no code change; deployment concern).

**Pros:**

- Single sign-in story (Firebase), scalable DB (Cloud SQL), serverless API (Cloud Run).
- Aligns with GCP best practices: managed auth, managed DB, containerized stateless API.
- Optional Vertex AI allows upgrading chat without rewriting the app.

**Cons:**

- Local development requires PostgreSQL (e.g. Docker or Cloud SQL Proxy) and a Firebase project (or emulator).
- No in-repo SQLite path for the “zero-setup” local run; that path was removed for a single, GCP-oriented stack.

---

## 2. Project Analysis and Current State (Before)

- **Frontend:** React, TypeScript, Vite, Tailwind. Auth via `AuthContext` storing a backend-issued JWT in `localStorage`; `api.ts` sent `Authorization: Bearer <token>`.
- **Backend:** Express, custom JWT (sign/verify with `JWT_SECRET`), **bcrypt** for passwords, **better-sqlite3** for SQLite. Routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, plus preferences, progress, stats, chat, meal-plans.
- **Database:** Single SQLite file; schema in `database.js` with sync helpers.
- **AI:** Rule-based logic in `ai-service.js` (no external LLM).

---

## 3. Changes Made (Summary)

| Area | Before | After (GCP Native) |
|------|--------|--------------------|
| Auth | Custom JWT + bcrypt, register/login on backend | Firebase Auth (client) + Firebase Admin (verify ID token); backend exposes `/api/auth/session` only |
| Database | SQLite (`better-sqlite3`), sync API | Cloud SQL PostgreSQL (`pg`), async API |
| Backend auth middleware | `jwt.verify(token, JWT_SECRET)` → `req.user.userId` | `verifyFirebaseToken(token)` → get/create user by `firebase_uid` → `req.user.userId` |
| Frontend auth | Call `/auth/register` and `/auth/login`, store JWT in localStorage | Firebase `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`, then `api.session(idToken)`; token from `auth.currentUser.getIdToken()` per request |
| AI | Rule-based only | Rule-based + optional Vertex AI (Gemini) when `VERTEX_AI_ENABLED=true` |
| Deployment | None | Dockerfile (server), `cloudbuild.yaml` (sample), README and `.env.example` for GCP |

---

## 4. File-by-File Changes and Thought Process

### 4.1 Backend

#### **server/server.js**

- **Removed:** `bcrypt`, `jsonwebtoken`, import from `database.js` (SQLite).
- **Added:** `dotenv/config`, `database-pg.js`, `auth-firebase.js`, `initFirebaseAdmin()` on startup.
- **Auth middleware:** Replaced JWT middleware with `authenticateFirebase`: reads `Authorization: Bearer <idToken>`, calls `verifyFirebaseToken(token)`, then `dbHelpers.getOrCreateUserByFirebaseUid(uid, email, name)` so every request has an app user; attaches `req.user = { userId, email, name }`.
- **Routes:** Removed `POST /api/auth/register` and `POST /api/auth/login`. Added `POST /api/auth/session` (body: `{ token, name? }`) to exchange a Firebase ID token for the app user (create if first time). All other routes use `authenticateFirebase` and async `dbHelpers` (e.g. `await dbHelpers.getPreferences(req.user.userId)`).
- **Health:** Added `GET /api/health` for Cloud Run/load balancer health checks.

**Thought process:** One source of truth for identity (Firebase); backend is stateless and only verifies tokens and maps to DB users. Session endpoint supports optional `name` for display name on first sign-up.

#### **server/database-pg.js** (new)

- New module for **Cloud SQL (PostgreSQL)** using the `pg` package.
- **Connection:** Uses `DATABASE_URL` if set, otherwise `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (or `DB_*` variants).
- **Schema:** Same logical schema as before (users, user_preferences, progress_entries, user_stats, badges, meal_plans) with Postgres types (`SERIAL`, `TEXT`, `BOOLEAN`, `TIMESTAMPTZ`). Added `users.firebase_uid` (unique, nullable for migration) and indexes.
- **Helpers:** All async. New: `getOrCreateUserByFirebaseUid(firebaseUid, email, name)` (find by `firebase_uid` or insert and initialize stats). Removed sync SQLite-only helpers; no `password_hash` required for Firebase-only users (column kept nullable for compatibility).

**Thought process:** Cloud SQL is the standard managed relational DB on GCP. Async API fits Node/Express and avoids blocking. One DB layer for the app (no dual SQLite/Postgres in code).

#### **server/auth-firebase.js** (new)

- Initializes **Firebase Admin SDK** using, in order: existing app, `FIREBASE_SERVICE_ACCOUNT_JSON` (parsed JSON), `GCLOUD_PROJECT` / `GCP_PROJECT` / `FIREBASE_PROJECT_ID`, or default (Application Default Credentials).
- Exports `verifyFirebaseToken(idToken)`: returns `{ uid, email, name }` or null on failure.

**Thought process:** Supports Cloud Run (ADC or env-injected service account from Secret Manager) and local dev (key file or ADC). No custom JWT issuance.

#### **server/ai-service.js**

- **Added:** Import of `./ai-vertex.js` (Vertex AI). At the start of `generateResponse`, if `vertexAI.isEnabled()` is true, call `vertexAI.generate(...)` and use its result if non-null; otherwise keep existing rule-based flow.

**Thought process:** Optional Gemini improves chat without breaking the app when Vertex AI is not configured.

#### **server/ai-vertex.js** (new)

- **Enabled when:** `VERTEX_AI_ENABLED=true` (or `1`) and `GCLOUD_PROJECT` (or `GCP_PROJECT`) is set.
- Uses `@google-cloud/vertexai` (dynamic import so the dependency is optional at runtime if not installed). Builds a short context string from preferences/stats/recent progress and calls Gemini (default `gemini-1.5-flash`). Returns trimmed text or null on error (fallback to rule-based).

**Thought process:** GCP-native AI via Vertex AI; model and location configurable via env.

#### **server/database.js**

- **Left as-is** (original SQLite implementation). No longer imported by `server.js`; kept for reference or a possible “legacy” or local-SQLite mode in the future. The app is documented and run as Postgres-only for the GCP-native path.

#### **server/package.json**

- **Removed:** `bcryptjs`, `jsonwebtoken`, `sqlite3`, `better-sqlite3`.
- **Added:** `firebase-admin`, `pg`, `@google-cloud/vertexai`, `dotenv`.
- **engines:** `node: ">=18"`.

#### **server/.env.example**

- Replaced JWT-only example with GCP-oriented vars: `PORT`; `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (or `DATABASE_URL`); `GCLOUD_PROJECT` and Firebase Admin options; optional `VERTEX_AI_*`.

#### **server/Dockerfile** (new)

- Node 20 slim image; `npm ci --omit=dev`; copy server files; expose 3001; `CMD ["node", "server.js"]`. Intended for building with context `server/` (e.g. `docker build -t porygon-api -f server/Dockerfile server`).

---

### 4.2 Frontend

#### **src/lib/firebase.ts** (new)

- Initializes Firebase app from `VITE_FIREBASE_*` env vars. Exports `auth` from `getAuth(app)`. Optional: if `VITE_FIREBASE_USE_EMULATOR=true`, connects Auth to `http://127.0.0.1:9099`.

**Thought process:** Single place for Firebase config; emulator support for local dev.

#### **src/lib/api.ts**

- **Token:** No longer reads from `localStorage`. Uses Firebase: `getToken()` is async and returns `auth.currentUser?.getIdToken(false)` so every API request sends a fresh ID token.
- **Auth endpoints:** Removed `register` and `login`. Added `session(idToken, name?)` and `sessionWithName(idToken, name?)` calling `POST /api/auth/session` with `{ token, name }`.
- **Request flow:** `request()` now `await this.getToken()` and sets `Authorization: Bearer <idToken>`.

**Thought process:** Backend only trusts Firebase; frontend never stores a custom JWT and always uses the current Firebase user’s token.

#### **src/contexts/AuthContext.tsx**

- **State:** Still holds app `user` (id, email, name) and `isLoading`.
- **Persistence:** Uses `onAuthStateChanged(auth, ...)`. When Firebase user exists, gets `getIdToken()`, calls `api.session(idToken)` to resolve app user (create if needed), then sets `user`.
- **Login:** `signInWithEmailAndPassword(auth, email, password)` → `api.session(idToken)` → set user.
- **Register:** `createUserWithEmailAndPassword(auth, email, password)` → `api.sessionWithName(idToken, name)` so backend can store display name on first create.
- **Logout:** `signOut(auth)` and clear local user state. No `localStorage` for tokens.

**Thought process:** Firebase owns session persistence; we only keep app user in React state and rely on Firebase for refresh and persistence.

#### **Root package.json**

- **Added:** `firebase` dependency (e.g. `^10.14.0`).

#### **.env.example** (root)

- Documented or left as-is; Firebase client vars (`VITE_FIREBASE_*`) can be added here or in the migration doc (see below).

---

### 4.3 Deployment and Config

#### **cloudbuild.yaml** (new)

- Sample Cloud Build: build Docker image from `server/` with `server/Dockerfile`, push to Artifact Registry, deploy to Cloud Run. Substitutions for service name and region. Does not configure secrets or DB; those are expected to be set on the Cloud Run service (e.g. from Secret Manager).

#### **.gcloudignore**

- Not added in this pass (user skipped). Recommended: ignore `node_modules`, `.env`, `.git`, etc., so only source and config needed for build are uploaded.

#### **README.md**

- Tech stack updated to GCP: Firebase Auth, Cloud SQL, Cloud Run, optional Vertex AI, Secret Manager.
- Setup: Postgres and Firebase (or emulator) required; env vars described; GCP deployment section added (Cloud Run + Firebase Hosting / Storage).
- Project structure updated to list `database-pg.js`, `auth-firebase.js`, `ai-vertex.js`, `Dockerfile`, `cloudbuild.yaml`.

---

## 5. Environment Variables (Reference)

**Backend (server/.env or Cloud Run env / Secret Manager):**

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default 3001). |
| `DATABASE_URL` or `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | Cloud SQL (PostgreSQL) connection. |
| `GCLOUD_PROJECT` | GCP project ID (Firebase Admin and optional Vertex AI). |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full service account JSON string (e.g. from Secret Manager). |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON file (alternative to above). |
| `VERTEX_AI_ENABLED` | Set to `true` to enable Gemini in chat. |
| `VERTEX_AI_LOCATION` | e.g. `us-central1`. |
| `VERTEX_AI_MODEL` | e.g. `gemini-1.5-flash`. |

**Frontend (.env with VITE_ prefix):**

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API base URL (e.g. Cloud Run URL). |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Firebase client config from Firebase Console. |
| `VITE_FIREBASE_USE_EMULATOR` | Set to `true` to use Auth emulator. |

---

## 6. GCP Best Practices Reflected

1. **Identity:** Use a managed identity product (Firebase Auth) instead of custom JWT and password storage.
2. **Database:** Use a managed relational DB (Cloud SQL) with connection pooling and async access.
3. **Compute:** Stateless API in a container, ready for Cloud Run (scale to zero, request-based).
4. **Secrets:** No secrets in code; use env vars that can be sourced from Secret Manager in Cloud Run.
5. **AI:** Use Vertex AI for generative features when needed, with a clear fallback.
6. **Health:** `/api/health` for uptime checks and load balancer.
7. **Documentation:** Single migration doc (this file) and updated README for setup and deployment.

---

## 7. What You Need to Run It

- **Local:** Node 18+, PostgreSQL (local or Cloud SQL Proxy), Firebase project (or Auth emulator). Copy `server/.env.example` to `server/.env` and root `.env.example` to `.env`, fill in Postgres and Firebase (and optional Vertex AI). Run `npm run server` and `npm run dev`.
- **GCP:** Create Cloud SQL (PostgreSQL) instance, run schema (via app’s `ensureSchema` on first request or a one-off script). Create a Firebase project and enable Email/Password sign-in; add a Web app and copy client config into frontend env. Build and deploy the server to Cloud Run (Dockerfile), set env vars (or Secret Manager). Deploy frontend (e.g. Firebase Hosting) with `VITE_API_URL` pointing to the Cloud Run URL and all `VITE_FIREBASE_*` set.

This completes the GCP native migration as implemented and documented.
