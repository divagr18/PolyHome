#!/bin/bash

# Create a Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

# Create staticfiles directory
echo "Creating staticfiles directory..."
mkdir -p staticfiles/static

# Run Django collectstatic
echo "Running collectstatic..."
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
    echo "Placeholder" > staticfiles/static/placeholder.txt
fi

echo "Build completed!"