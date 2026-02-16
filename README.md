
# Porygon Meal Planner

A comprehensive meal planning app with an AI-powered nutrition coach that helps users create personalized meal plans, track progress, and build healthy habits through conversational guidance.

## Features

- **User Authentication**: Secure login/signup system
- **Conversational Onboarding**: AI-guided setup to collect preferences (allergies, food likes/dislikes, goals, etc.)
- **Personalized Meal Plans**: AI-generated meal plans based on user preferences
- **Progress Tracking**: Daily check-ins to track meals and progress
- **Emotional Support**: Encouraging messages, rewards, and timeline expectations
- **Badge System**: Earn badges for milestones and consistency
- **Grocery Lists**: Auto-generated shopping lists based on meal plans
- **Inventory Management**: Track ingredients and get suggestions

## Tech Stack (GCP Native)

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, **Firebase Auth (client)**
- **Backend**: **Python, Flask**, Cloud Run
- **Database**: **Cloud SQL (PostgreSQL)** via Flask-SQLAlchemy
- **Authentication**: **Firebase Authentication** (ID token verification)
- **AI**: Rule-based coach + optional **Vertex AI (Gemini)** for chat
- **Secrets**: **Secret Manager** (recommended in production)

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- For GCP: Google Cloud project, Firebase project (same or linked), Cloud SQL (PostgreSQL)

### Installation

1. **Install frontend dependencies:**
   ```bash
   npm install
   ```

2. **Install backend dependencies (Python):**
   ```bash
   cd server
   pip install -r requirements.txt
   cd ..
   ```
   Use a virtualenv (e.g. `python -m venv .venv` then `source .venv/bin/activate`) recommended.

3. **Set up environment variables:**
   
   Create `.env` in the root (see `.env.example`):
   - `VITE_API_URL` – backend API base URL
   - `VITE_FIREBASE_*` – Firebase client config (from Firebase Console)
   
   Create `server/.env` (see `server/.env.example`):
   - `PORT`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (or `DATABASE_URL`)
   - `GCLOUD_PROJECT` and Firebase Admin credentials (`FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`)
   - Optional: `VERTEX_AI_ENABLED`, `VERTEX_AI_LOCATION`, `VERTEX_AI_MODEL`

### Running the Application

1. **Start PostgreSQL** (e.g. local or Cloud SQL Proxy).
2. **Start the backend** (in one terminal, from repo root):
   ```bash
   npm run server
   ```
   or `cd server && python app.py`. The server runs on http://localhost:3001
3. **Start the frontend** (in another terminal):
   ```bash
   npm run dev
   ```
   The app will be at http://localhost:5173

### GCP Deployment

- **Backend**: Build with `server/Dockerfile` and deploy to **Cloud Run**. Use **Cloud SQL** for Postgres and **Secret Manager** for DB credentials and Firebase service account.
- **Frontend**: Build with `npm run build` and deploy to **Firebase Hosting** or **Cloud Storage + Load Balancer**.
- See `cloudbuild.yaml` for a sample Cloud Build pipeline and `ai_docs/tasks/` for full migration notes.

## Usage

1. **Sign Up**: Create an account with your email and password
2. **Onboarding**: The AI will guide you through collecting your preferences:
   - Food allergies
   - Foods you dislike
   - Foods you like
   - Meals per day
   - Quick vs cooked meal preference
   - Health goals
   - Bad habits to change
   - Body scan information (optional)
3. **Chat**: Interact with the AI coach to:
   - Get meal plan suggestions
   - Check in about what you ate
   - Ask for motivation and support
   - Get healthier alternatives
   - Track your progress
4. **Track Progress**: Use the progress tracker to log meals and see your stats

## Project Structure

```
porygon-meal-planner/
├── server/                  # Backend API (Flask / Python, GCP native)
│   ├── app.py               # Flask app and routes
│   ├── config.py            # Config from env
│   ├── models.py            # SQLAlchemy models
│   ├── database.py          # DB helpers
│   ├── auth_firebase.py     # Firebase Admin token verification
│   ├── ai_service.py       # Rule-based + optional Vertex AI
│   ├── ai_vertex.py        # Vertex AI (Gemini) integration
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # For Cloud Run
├── src/
│   ├── app/                 # Main app component
│   ├── components/          # React components
│   ├── contexts/             # Auth (Firebase)
│   └── lib/                  # API client, Firebase config
├── cloudbuild.yaml          # Sample Cloud Build
└── package.json
```

## Development

- Frontend: Vite dev server with hot reload
- Backend: Node with watch mode; requires PostgreSQL (local or Cloud SQL Proxy)
- Auth: Firebase Auth (client) + Firebase Admin (server); optional Auth emulator

## License

Private project
