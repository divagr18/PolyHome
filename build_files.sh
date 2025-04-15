#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "=== Starting Vercel Build Script ==="

# 1. Build Frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..
echo "Frontend build complete. Output at frontend/dist/"

# 2. Install Backend Dependencies
echo "Installing Python dependencies..."
# Ensure Vercel provides python3.9 in the build environment
python3.9 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
echo "Python dependencies installed."

# 3. Collect Django Static Files
echo "Collecting Django static files..."
# Ensure STATIC_ROOT is set in settings.py (e.g., BASE_DIR / '..' / 'staticfiles')
# Run manage.py using the virtual environment's python
venv/bin/python backend/manage.py collectstatic --noinput --clear
echo "Collect static complete. Files in staticfiles/ (or your STATIC_ROOT)"


echo "Build script finished!"