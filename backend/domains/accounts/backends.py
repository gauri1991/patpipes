"""
Custom Authentication Backends
Allows login with both username and email
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db import models

User = get_user_model()


class EmailOrUsernameModelBackend(ModelBackend):
    """
    Custom authentication backend that allows login with either username or email.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)

        if username is None or password is None:
            return None

        # Try to find user by email first, then by username
        try:
            # If username looks like an email, try email lookup first
            if '@' in username:
                try:
                    user = User.objects.get(email=username)
                except User.DoesNotExist:
                    # If email doesn't exist, try username lookup
                    try:
                        user = User.objects.get(username=username)
                    except User.DoesNotExist:
                        return None
            else:
                # If it doesn't look like an email, try username first
                try:
                    user = User.objects.get(username=username)
                except User.DoesNotExist:
                    # If username doesn't exist, try email lookup
                    try:
                        user = User.objects.get(email=username)
                    except User.DoesNotExist:
                        return None
            
        except User.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a nonexistent user
            User().set_password(password)
            return None

        # Check password and return user if valid
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

    def user_can_authenticate(self, user):
        """
        Reject users with is_active=False. Custom user models that don't have
        an `is_active` field are allowed.
        """
        is_active = getattr(user, 'is_active', None)
        return is_active or is_active is None