"""
Firebase Admin SDK - verify ID tokens (GCP native). Python port of auth-firebase.js.
"""
import os
import json

_firebase_app = None


def init_firebase_admin():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    try:
        import firebase_admin
        from firebase_admin import credentials

        if firebase_admin._apps:
            _firebase_app = firebase_admin.get_app()
            return _firebase_app

        json_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        if json_str:
            key = json.loads(json_str)
            _firebase_app = firebase_admin.initialize_app(credentials.Cert(key))
            return _firebase_app

        project_id = os.environ.get("GCLOUD_PROJECT") or os.environ.get("GCP_PROJECT") or os.environ.get("FIREBASE_PROJECT_ID")
        if project_id:
            _firebase_app = firebase_admin.initialize_app(options={"projectId": project_id})
            return _firebase_app

        _firebase_app = firebase_admin.initialize_app()
    except Exception as e:
        print(f"Firebase Admin init skipped: {e}")
    return _firebase_app


def verify_firebase_token(id_token):
    """Verify Firebase ID token; return dict with uid, email, name or None."""
    init_firebase_admin()
    try:
        import firebase_admin
        from firebase_admin import auth

        if not firebase_admin._apps:
            return None
        decoded = auth.verify_id_token(id_token)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email"),
            "name": decoded.get("name") or decoded.get("display_name"),
        }
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None
