#!/bin/bash
set -e

echo "=== Starting build_files.sh ==="

# Install frontend deps (optional if cached)
npm install

# Run vite production build to create /frontend/dist folder
npm run build

cd ..

# BACKEND - Setup Python environment
echo "Installing Python dependencies..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip and install requirements
pip install --upgrade pip
pip install -r backend/requirements.txt

# Collect Django static files into staticfiles/static
echo "Collecting Django static files..."
cd backend
source ../venv/bin/activate
python manage.py collectstatic --noinput --clear --no-post-process

cd ..

echo "Build complete!"