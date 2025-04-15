import os
# IMPORTANT: Replace 'your_project_name' with the actual name of your Django project folder
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project_name.settings')

# Import the Django ASGI app *after* setting the environment variable
from realestateassistant.asgi import application # Make sure this matches your asgi.py location
from mangum import Mangum

# Wrap the Django app with Mangum for Vercel compatibility
handler = Mangum(application, lifespan="off")