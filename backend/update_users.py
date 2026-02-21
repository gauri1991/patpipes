#!/usr/bin/env python
"""
Update all users to use patpipes.com domain and set password to admin123
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.accounts.models import User

def update_users():
    """Update all users' emails and passwords"""
    users = User.objects.all()

    print(f"Found {users.count()} users to update")
    print("-" * 80)

    updated_count = 0
    email_counter = {}

    for user in users:
        old_email = user.email

        # Extract username from old email (before @)
        base_username = old_email.split('@')[0]

        # Handle duplicate usernames by adding a number
        if base_username in email_counter:
            email_counter[base_username] += 1
            username = f"{base_username}{email_counter[base_username]}"
        else:
            email_counter[base_username] = 0
            username = base_username

        # Create new email with patpipes.com domain
        new_email = f"{username}@patpipes.com"

        # Update email and username
        user.email = new_email
        user.username = new_email

        # Set password to admin123
        user.set_password('admin123')

        # Save user
        user.save()

        print(f"✓ Updated: {old_email} → {new_email}")
        print(f"  Name: {user.first_name} {user.last_name}")
        print(f"  Role: {user.role}")
        print(f"  Password: admin123")
        print()

        updated_count += 1

    print("-" * 80)
    print(f"Successfully updated {updated_count} users!")
    print()
    print("All users now have:")
    print("  • Email domain: @patpipes.com")
    print("  • Password: admin123")

if __name__ == '__main__':
    update_users()
