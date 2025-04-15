*   **`build_vercel.sh`:**
    ```bash
    #!/bin/bash

    # Exit immediately if a command exits with a non-zero status.
    set -e

    echo "=== Starting Vercel Build Script ==="

    # 1. Build Frontend
    echo "Building frontend..."
    # Navigate to frontend, install deps, build, return to root
    cd frontend
    npm install
    npm run build
    cd ..

    # 2. Install Backend Dependencies (using the Python version specified for Vercel)
    echo "Installing Python dependencies..."
    # Use python3.9 as specified in your vercel.json runtime
    python3.9 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r backend/requirements.txt

    # 3. Collect Django Static Files
    echo "Collecting Django static files..."
    # Run collectstatic from the root, targeting the backend manage.py
    # Ensure STATIC_ROOT is configured correctly in settings.py
    # This command assumes STATIC_ROOT is set, e.g., to 'staticfiles'
    python backend/manage.py collectstatic --noinput --clear

    echo "Build complete!"
    ```