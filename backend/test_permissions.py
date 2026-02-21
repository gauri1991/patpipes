#!/usr/bin/env python
"""
Test permission persistence
This script tests that permission changes are saved and retrieved correctly
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.accounts.models import RolePermission, User


def test_permission_persistence():
    """Test that permission changes persist in database"""
    print("Testing permission persistence...")
    print("-" * 80)

    # Test 1: Verify all roles are in database
    print("\nTest 1: Verify all roles are in database")
    roles = ['admin', 'manager', 'supervisor', 'lead_attorney', 'attorney', 'paralegal', 'analyst', 'client', 'guest']
    for role in roles:
        try:
            role_perm = RolePermission.objects.get(role=role)
            print(f"  ✓ {role}: {len(role_perm.permissions)} permissions")
        except RolePermission.DoesNotExist:
            print(f"  ✗ {role}: NOT FOUND")
            return False

    # Test 2: Check client role permissions (the problematic one)
    print("\nTest 2: Check client role permissions")
    client_role = RolePermission.objects.get(role='client')
    print(f"  Client has {len(client_role.permissions)} permissions")
    print(f"  Sidebar permissions:")
    sidebar_perms = [p for p in client_role.permissions if p.startswith('sidebar_')]
    for perm in sidebar_perms:
        print(f"    - {perm}")

    # Test 3: Modify client permissions and verify persistence
    print("\nTest 3: Modify client permissions and verify persistence")
    original_perms = client_role.permissions.copy()
    print(f"  Original client permissions count: {len(original_perms)}")

    # Add a new permission
    test_perm = 'sidebar_workflows'
    if test_perm not in client_role.permissions:
        client_role.permissions.append(test_perm)
        client_role.save()
        print(f"  Added permission: {test_perm}")

    # Refresh from database
    client_role.refresh_from_db()
    if test_perm in client_role.permissions:
        print(f"  ✓ Permission persisted: {test_perm}")
    else:
        print(f"  ✗ Permission NOT persisted: {test_perm}")
        return False

    # Test 4: Remove the test permission (cleanup)
    print("\nTest 4: Remove test permission (cleanup)")
    if test_perm in client_role.permissions:
        client_role.permissions.remove(test_perm)
        client_role.save()
        print(f"  Removed permission: {test_perm}")

    # Refresh from database
    client_role.refresh_from_db()
    if test_perm not in client_role.permissions:
        print(f"  ✓ Permission removal persisted")
    else:
        print(f"  ✗ Permission removal NOT persisted")
        return False

    # Test 5: Check if client user has correct permissions
    print("\nTest 5: Check client user permissions")
    try:
        client_user = User.objects.filter(role='client').first()
        if client_user:
            print(f"  Found client user: {client_user.email}")
            client_role = RolePermission.objects.get(role='client')
            print(f"  Client role has {len(client_role.permissions)} permissions")

            # Check specific sidebar permissions
            sidebar_perms = [p for p in client_role.permissions if p.startswith('sidebar_')]
            print(f"  Sidebar permissions: {', '.join(sidebar_perms)}")
        else:
            print("  No client user found to test")
    except Exception as e:
        print(f"  Error checking client user: {e}")

    print("\n" + "-" * 80)
    print("✓ All permission persistence tests passed!")
    print("\nKey findings:")
    print("  - Role permissions are stored in database")
    print("  - Permission changes persist correctly")
    print("  - Permission modifications are saved and retrieved")
    print("  - Client sidebar permissions can be managed dynamically")
    return True


if __name__ == '__main__':
    try:
        success = test_permission_persistence()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
