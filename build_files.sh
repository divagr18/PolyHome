#!/bin/bash
set -e # Exit on first error

echo "=== Starting build_files.sh ==="

# 1. Build Frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..
echo "Frontend build complete. Output at frontend/dist/"

# 2. Install Backend Dependencies
echo "Installing Python dependencies using python3.9..."
python3.9 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
echo "Python dependencies installed."

# 3. Collect Django Static Files
echo "Collecting Django static files into 'staticfiles' directory..."
# Ensure STATIC_ROOT in settings.py is configured correctly (e.g., project_root/staticfiles)
venv/bin/python backend/manage.py collectstatic --noinput --clear
echo "Collect static complete."

echo "Build script finished!"