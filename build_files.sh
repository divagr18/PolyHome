#!/bin/bash

# Create a Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
python -m pip install --upgrade pip

# Install dependencies from requirements.txt
echo "Installing requirements from requirements.txt..."
pip install -r requirements.txt

# Create staticfiles directory
echo "Creating staticfiles directory..."
mkdir -p staticfiles/static

# Create a simple placeholder file to ensure the directory exists
echo "Creating placeholder file..."
touch staticfiles/static/placeholder.txt

echo "Build completed!"