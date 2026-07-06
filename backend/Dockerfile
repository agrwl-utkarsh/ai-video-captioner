FROM python:3.10-slim

# Install system dependencies (ffmpeg and git are required by Whisper)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies (using path relative to repo root)
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the Whisper base model so it is cached in the Docker image
RUN python -c "import whisper; whisper.load_model('base')"

# Copy the rest of the backend application code
COPY backend/ .

# Run the Flask app using Gunicorn, binding to the PORT environment variable provided by Render
CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120 app:app
