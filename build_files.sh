#!/bin/bash

# Create a Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
python -m pip install --upgrade pip

# Explicitly install django-cors-headers
echo "Installing django-cors-headers..."
pip install django-cors-headers

# Install other dependencies from requirements.txt if it exists
if [ -f "requirements.txt" ]; then
    echo "Installing requirements from requirements.txt..."
    pip install -r requirements.txt
else
    echo "No requirements.txt found, installing base dependencies..."
    pip install django djangorestframework
fi

# Create staticfiles directory
echo "Creating staticfiles directory..."
mkdir -p staticfiles/static

# Run Django collectstatic - trying with different settings path options
echo "Running collectstatic..."
python backend/manage.py collectstatic --noinput || \
python backend/manage.py collectstatic --noinput --settings=backend.realestateassistant.settings || \
python backend/manage.py collectstatic --noinput --settings=realestateassistant.settings

# Check if collectstatic created files and copy them
if [ -d "backend/static" ]; then
    echo "Copying static files from backend/static..."
    cp -r backend/static/* staticfiles/static/
elif [ -d "backend/staticfiles" ]; then
    echo "Copying static files from backend/staticfiles..."
    cp -r backend/staticfiles/* staticfiles/
else
    echo "No static files found. Creating placeholder..."
    touch staticfiles/static/placeholder.txt
fi

echo "Build completed!"