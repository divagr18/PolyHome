import os
import django
import random
from faker import Faker  # pip install Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'realestateassistant.settings')  # Replace 'realestateassistant' with your project name
django.setup()

from django.contrib.auth import get_user_model
from clients.models import Client  # Corrected app name
from chat.models import Chat

User = get_user_model()

fake = Faker()

def seed_data(num_clients=5, messages_per_client=10):
    """Seeds the database with sample clients and chat history."""

    print("Seeding the database...")

    # Ensure the agent user (ID 1) exists
    agent_user, created = User.objects.get_or_create(pk=1, defaults={'username': 'agent', 'password': 'password'})
    if created:
        print("Created agent user with ID 1.")
    else:
        print("Agent user with ID 1 already exists.")

    # Create a Client object for the agent user
    agent_client, created = Client.objects.get_or_create(
        user=agent_user,
        defaults={
            'name': 'Agent Client',
            'phone_number': fake.phone_number(),
            'email': fake.email(),
            'preferences': 'Handles all client inquiries'
        }
    )
    if created:
        print("Created Client object for the agent user.")
    else:
        print("Client object for the agent user already exists.")

    # Create sample clients
    clients = []
    for i in range(num_clients):
        # Create a unique user for each client
        username = f"client_user_{i+2}"  # Start client usernames from 2 to avoid collision with agent (ID 1)
        user = User.objects.create_user(username=username, password="password")
        print(f"Created client user: {user.username}")

        client = Client.objects.create(
            user=user,
            name=fake.name(),
            phone_number=fake.numerify('##########'), #10 digit number
            email=fake.email(),
            preferences=fake.text()
        )
        clients.append(client)
        print(f"Created client: {client.name}")

    # Create sample chat history
    for client in clients:
        for _ in range(messages_per_client):
            # Randomly choose sender (agent or client)
            if random.random() < 0.5: # 50% chance the agent sends the message
                sender = agent_user
                recipient = client
            else:
                sender = client.user  # Client sends the message, sender is the client's user
                recipient = agent_client # Recipient is the agent

            message = Chat.objects.create(
                sender=sender,
                recipient=recipient,
                message=fake.sentence()
            )
            print(f"Created message: From {message.sender} to {message.recipient}")

    print("Database seeding complete!")

if __name__ == '__main__':
    seed_data()