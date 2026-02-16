# Porygon Meal Planner API - Flask (Python), GCP native
# Build from repo root: docker build -t porygon-api -f server/Dockerfile server
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 3001

ENV PORT=3001
CMD ["sh", "-c", "exec gunicorn -b 0.0.0.0:${PORT:-3001} -w 2 app:app"]
