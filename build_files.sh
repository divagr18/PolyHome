#!/bin/bash
echo "Build Script Starting..."
# Ensure script exits immediately if any command fails
set -e

# Upgrade pip if necessary
# python -m pip install --upgrade pip

# Install Python dependencies listed in requirements.txt
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create the directory for Django's collectstatic (even if not directly served)
echo "Preparing staticfiles directory..."
mkdir -p staticfiles_build

# Run Django's collectstatic
echo "Running collectstatic..."
python manage.py collectstatic --noinput --clear

echo "Build Script Finished."