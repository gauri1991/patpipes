#!/usr/bin/env python
"""
Create client accounts for testing
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.accounts.models import User

def create_clients():
    """Create client accounts"""

    clients_data = [
        {
            'email': 'client1@patpipes.com',
            'first_name': 'Michael',
            'last_name': 'Chen',
            'role': 'client',
        },
        {
            'email': 'client2@patpipes.com',
            'first_name': 'Jennifer',
            'last_name': 'Martinez',
            'role': 'client',
        },
        {
            'email': 'client3@patpipes.com',
            'first_name': 'Robert',
            'last_name': 'Williams',
            'role': 'client',
        },
        {
            'email': 'client4@patpipes.com',
            'first_name': 'Linda',
            'last_name': 'Thompson',
            'role': 'client',
        },
        {
            'email': 'client5@patpipes.com',
            'first_name': 'David',
            'last_name': 'Jackson',
            'role': 'client',
        },
    ]

    print("Creating client accounts...")
    print("-" * 80)

    created_count = 0

    for client_data in clients_data:
        # Check if user already exists
        if User.objects.filter(email=client_data['email']).exists():
            print(f"⚠ User already exists: {client_data['email']}")
            continue

        # Create user
        user = User.objects.create_user(
            email=client_data['email'],
            password='admin123',
            first_name=client_data['first_name'],
            last_name=client_data['last_name'],
            role=client_data['role'],
            status='active',
        )

        print(f"✓ Created: {user.email}")
        print(f"  Name: {user.first_name} {user.last_name}")
        print(f"  Role: {user.role}")
        print(f"  Password: admin123")
        print()

        created_count += 1

    print("-" * 80)
    print(f"Successfully created {created_count} client account(s)!")
    print()
    print("Client Login Credentials:")
    print("  Email: client1@patpipes.com (or client2-5)")
    print("  Password: admin123")

if __name__ == '__main__':
    create_clients()
