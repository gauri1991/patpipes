"""
Authentication Views
JWT-based authentication for the patent analytics platform
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
import random
import string
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


def send_password_reset_email(email: str, code: str) -> bool:
    """Send password reset email with verification code"""
    try:
        subject = f'{settings.EMAIL_SUBJECT_PREFIX}Password Reset Verification Code'

        # Plain text message
        message = f"""
Hello,

You have requested to reset your password for your Patent Analytics account.

Your verification code is: {code}

This code will expire in 15 minutes.

If you did not request this password reset, please ignore this email.

Best regards,
Patent Analytics Team
        """.strip()

        # HTML message
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>You have requested to reset your password for your Patent Analytics account.</p>
                <div style="background-color: #fff; padding: 20px; border-radius: 4px; text-align: center; margin: 20px 0;">
                    <p style="margin: 0; color: #666;">Your verification code is:</p>
                    <h1 style="color: #00D9FF; font-size: 36px; letter-spacing: 8px; margin: 10px 0;">{code}</h1>
                </div>
                <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you did not request this password reset, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">Best regards,<br>Patent Analytics Team</p>
            </div>
        </body>
        </html>
        """

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Password reset email sent to {email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        # In debug mode, also print the code for testing
        if settings.DEBUG:
            print(f"[DEBUG] Password reset code for {email}: {code}")
        return False


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login endpoint that returns JWT tokens - supports both email and username"""
    # Accept either 'email' or 'username' field
    identifier = request.data.get('email') or request.data.get('username')
    password = request.data.get('password')

    if not identifier or not password:
        return Response({
            'error': 'Email/username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Try to authenticate with the identifier (could be email or username)
    user = authenticate(request, username=identifier, password=password)

    # If authentication with identifier fails and it looks like an email,
    # try to find user by email and authenticate
    if not user and '@' in identifier:
        try:
            user_obj = User.objects.get(email=identifier)
            user = authenticate(request, username=user_obj.username if hasattr(user_obj, 'username') else user_obj.email, password=password)
        except User.DoesNotExist:
            pass

    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
            }
        })
    else:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register new user endpoint"""
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    role = request.data.get('role', 'viewer')
    
    if not email or not password:
        return Response({
            'error': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({
            'error': 'User with this email already exists'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role=role
    )
    
    refresh = RefreshToken.for_user(user)
    return Response({
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
        'user': {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
        }
    })


@api_view(['POST'])
def logout_view(request):
    """Logout endpoint"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out'})
    except Exception:
        return Response({'message': 'Successfully logged out'})


@api_view(['GET'])
def user_profile_view(request):
    """Get current user profile"""
    user = request.user
    return Response({
        'id': str(user.id),
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_view(request):
    """Refresh JWT token"""
    refresh_token = request.data.get('refresh_token')
    
    if not refresh_token:
        return Response({
            'error': 'Refresh token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        refresh = RefreshToken(refresh_token)
        return Response({
            'access_token': str(refresh.access_token),
        })
    except Exception:
        return Response({
            'error': 'Invalid refresh token'
        }, status=status.HTTP_401_UNAUTHORIZED)


def generate_reset_code():
    """Generate a 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_request(request):
    """Request password reset - sends verification code to email"""
    email = request.data.get('email')

    if not email:
        return Response({
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # For security, don't reveal if email exists or not
        return Response({
            'message': 'If this email exists, a verification code has been sent'
        })

    # Generate 6-digit code
    code = generate_reset_code()

    # Store code in cache with 15 minute expiration
    cache_key = f'password_reset_{email}'
    cache.set(cache_key, code, 900)  # 15 minutes

    # Send email with code
    email_sent = send_password_reset_email(email, code)

    response_data = {
        'message': 'Verification code sent to your email'
    }

    # In debug mode, include the code in response for testing
    if settings.DEBUG:
        response_data['code'] = code
        response_data['email_sent'] = email_sent

    return Response(response_data)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_code(request):
    """Verify the reset code"""
    email = request.data.get('email')
    code = request.data.get('code')

    if not email or not code:
        return Response({
            'error': 'Email and code are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if user exists
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'error': 'Invalid email or code'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get stored code from cache
    cache_key = f'password_reset_{email}'
    stored_code = cache.get(cache_key)

    if not stored_code or stored_code != code:
        return Response({
            'error': 'Invalid or expired code'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Generate temporary token for password reset (valid for 30 minutes)
    reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    reset_token_key = f'password_reset_token_{reset_token}'
    cache.set(reset_token_key, email, 1800)  # 30 minutes

    # Delete the verification code (one-time use)
    cache.delete(cache_key)

    return Response({
        'message': 'Code verified successfully',
        'reset_token': reset_token
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with verified token"""
    reset_token = request.data.get('reset_token')
    new_password = request.data.get('password')

    if not reset_token or not new_password:
        return Response({
            'error': 'Reset token and new password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({
            'error': 'Password must be at least 8 characters'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get email from reset token
    reset_token_key = f'password_reset_token_{reset_token}'
    email = cache.get(reset_token_key)

    if not email:
        return Response({
            'error': 'Invalid or expired reset token'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Update password
    user.set_password(new_password)
    user.save()

    # Delete the reset token (one-time use)
    cache.delete(reset_token_key)

    return Response({
        'message': 'Password reset successfully'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_reset_code(request):
    """Resend password reset code"""
    email = request.data.get('email')

    if not email:
        return Response({
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # For security, don't reveal if email exists or not
        return Response({
            'message': 'If this email exists, a new verification code has been sent'
        })

    # Generate new 6-digit code
    code = generate_reset_code()

    # Store code in cache with 15 minute expiration
    cache_key = f'password_reset_{email}'
    cache.set(cache_key, code, 900)  # 15 minutes

    # Send email with code
    email_sent = send_password_reset_email(email, code)

    response_data = {
        'message': 'New verification code sent to your email'
    }

    # In debug mode, include the code in response for testing
    if settings.DEBUG:
        response_data['code'] = code
        response_data['email_sent'] = email_sent

    return Response(response_data)