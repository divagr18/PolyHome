#!/bin/bash

# Create a Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

# Run Django collectstatic
echo "Running collectstatic..."
python backend/manage.py collectstatic --noinput --clear

# Create staticfiles directory if it doesn't exist
mkdir -p staticfiles/static

# Copy collected static files to the staticfiles directory
cp -r backend/staticfiles/* staticfiles/