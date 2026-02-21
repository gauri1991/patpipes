#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.accounts.models import RolePermission, User

# Check client role permissions in database
print("Checking client role permissions in database...")
print("-" * 80)

try:
    client_role = RolePermission.objects.get(role='client')
    print(f"Client role permissions ({len(client_role.permissions)} items):")
    print("\nAll permissions:")
    for perm in client_role.permissions:
        print(f"  - {perm}")
    
    print("\nSidebar permissions:")
    sidebar_perms = [p for p in client_role.permissions if p.startswith('sidebar_')]
    for perm in sidebar_perms:
        print(f"  - {perm}")
    
    print(f"\nLast updated: {client_role.updated_at}")
    print(f"Updated by: {client_role.updated_by}")
    
except RolePermission.DoesNotExist:
    print("Client role not found in database!")

# Check a client user
print("\n" + "-" * 80)
print("Checking client user...")
client = User.objects.filter(role='client').first()
if client:
    print(f"Client user: {client.email}")
    print(f"Role: {client.role}")
