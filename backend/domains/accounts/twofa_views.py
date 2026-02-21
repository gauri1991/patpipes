"""
Two-Factor Authentication Views
TOTP-based 2FA implementation using pyotp
"""

import pyotp
import qrcode
import io
import base64
from datetime import datetime

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import TwoFactorAuth, UserSettings


def get_totp_uri(user, secret):
    """Generate TOTP URI for QR code"""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(
        name=user.email,
        issuer_name="Patent Analytics Platform"
    )


def generate_qr_code(uri):
    """Generate QR code as base64 image"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setup_2fa(request):
    """
    Initiate 2FA setup - generates secret and returns QR code
    """
    user = request.user

    # Check if already has verified 2FA
    try:
        existing_2fa = TwoFactorAuth.objects.get(user=user)
        if existing_2fa.is_verified:
            return Response({
                'success': False,
                'message': '2FA is already enabled for this account'
            }, status=status.HTTP_400_BAD_REQUEST)
        # Delete unverified setup to start fresh
        existing_2fa.delete()
    except TwoFactorAuth.DoesNotExist:
        pass

    # Generate new secret
    secret = pyotp.random_base32()

    # Create 2FA record (unverified)
    two_factor = TwoFactorAuth.objects.create(
        user=user,
        secret_key=secret,
        is_verified=False
    )

    # Generate QR code
    uri = get_totp_uri(user, secret)
    qr_code = generate_qr_code(uri)

    return Response({
        'success': True,
        'data': {
            'secret': secret,  # Manual entry option
            'qr_code': f"data:image/png;base64,{qr_code}",
            'message': 'Scan the QR code with your authenticator app, then verify with a code'
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_2fa(request):
    """
    Verify 2FA setup by checking a TOTP code
    Also used for login verification
    """
    user = request.user
    code = request.data.get('code', '').strip()

    if not code:
        return Response({
            'success': False,
            'message': 'Verification code is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        two_factor = TwoFactorAuth.objects.get(user=user)
    except TwoFactorAuth.DoesNotExist:
        return Response({
            'success': False,
            'message': '2FA has not been set up for this account'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verify the TOTP code
    totp = pyotp.TOTP(two_factor.secret_key)
    if not totp.verify(code, valid_window=1):  # Allow 1 window tolerance
        # Check backup codes
        if two_factor.use_backup_code(code):
            two_factor.last_used_at = datetime.now()
            two_factor.save()
            return Response({
                'success': True,
                'message': 'Verified with backup code',
                'backup_codes_remaining': len(two_factor.backup_codes)
            })

        return Response({
            'success': False,
            'message': 'Invalid verification code'
        }, status=status.HTTP_400_BAD_REQUEST)

    # If this is the initial setup verification
    if not two_factor.is_verified:
        two_factor.is_verified = True
        two_factor.save()

        # Update user settings
        settings_obj, _ = UserSettings.objects.get_or_create(user=user)
        settings_obj.two_factor_enabled = True
        settings_obj.save()

        # Generate backup codes
        backup_codes = two_factor.generate_backup_codes()

        return Response({
            'success': True,
            'message': '2FA has been successfully enabled',
            'backup_codes': backup_codes,
            'note': 'Save these backup codes securely. They can be used if you lose access to your authenticator app.'
        })

    # Regular verification (e.g., during login)
    two_factor.last_used_at = datetime.now()
    two_factor.save()

    return Response({
        'success': True,
        'message': 'Verification successful'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    """
    Disable 2FA - requires current password or backup code
    """
    user = request.user
    password = request.data.get('password', '')
    code = request.data.get('code', '')

    # Verify password
    if not user.check_password(password):
        return Response({
            'success': False,
            'message': 'Invalid password'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        two_factor = TwoFactorAuth.objects.get(user=user)
    except TwoFactorAuth.DoesNotExist:
        return Response({
            'success': False,
            'message': '2FA is not enabled for this account'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Optionally verify with 2FA code for extra security
    if code:
        totp = pyotp.TOTP(two_factor.secret_key)
        if not totp.verify(code, valid_window=1):
            return Response({
                'success': False,
                'message': 'Invalid 2FA code'
            }, status=status.HTTP_400_BAD_REQUEST)

    # Delete 2FA record
    two_factor.delete()

    # Update user settings
    try:
        settings_obj = UserSettings.objects.get(user=user)
        settings_obj.two_factor_enabled = False
        settings_obj.save()
    except UserSettings.DoesNotExist:
        pass

    return Response({
        'success': True,
        'message': '2FA has been disabled'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_2fa_status(request):
    """
    Get current 2FA status for the user
    """
    user = request.user

    try:
        two_factor = TwoFactorAuth.objects.get(user=user)
        return Response({
            'success': True,
            'data': {
                'enabled': two_factor.is_verified,
                'backup_codes_count': len(two_factor.backup_codes),
                'last_used': two_factor.last_used_at
            }
        })
    except TwoFactorAuth.DoesNotExist:
        return Response({
            'success': True,
            'data': {
                'enabled': False,
                'backup_codes_count': 0,
                'last_used': None
            }
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_backup_codes(request):
    """
    Regenerate backup codes - requires 2FA verification
    """
    user = request.user
    code = request.data.get('code', '').strip()

    if not code:
        return Response({
            'success': False,
            'message': 'Verification code is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        two_factor = TwoFactorAuth.objects.get(user=user)
    except TwoFactorAuth.DoesNotExist:
        return Response({
            'success': False,
            'message': '2FA is not enabled for this account'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not two_factor.is_verified:
        return Response({
            'success': False,
            'message': '2FA setup is not complete'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verify the TOTP code
    totp = pyotp.TOTP(two_factor.secret_key)
    if not totp.verify(code, valid_window=1):
        return Response({
            'success': False,
            'message': 'Invalid verification code'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Generate new backup codes
    backup_codes = two_factor.generate_backup_codes()

    return Response({
        'success': True,
        'message': 'New backup codes generated',
        'backup_codes': backup_codes,
        'note': 'Previous backup codes are now invalid. Save these new codes securely.'
    })


@api_view(['POST'])
def verify_2fa_login(request):
    """
    Verify 2FA during login process (called after password verification)
    Expects user_id and code in request
    """
    from .models import User

    user_id = request.data.get('user_id')
    code = request.data.get('code', '').strip()

    if not user_id or not code:
        return Response({
            'success': False,
            'message': 'User ID and verification code are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        two_factor = TwoFactorAuth.objects.get(user=user)
    except TwoFactorAuth.DoesNotExist:
        return Response({
            'success': False,
            'message': '2FA is not enabled for this account'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not two_factor.is_verified:
        return Response({
            'success': False,
            'message': '2FA setup is not complete'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verify the TOTP code
    totp = pyotp.TOTP(two_factor.secret_key)
    if not totp.verify(code, valid_window=1):
        # Check backup codes
        if two_factor.use_backup_code(code):
            two_factor.last_used_at = datetime.now()
            two_factor.save()
            return Response({
                'success': True,
                'message': 'Verified with backup code',
                'user_id': str(user.id),
                'requires_new_backup_codes': len(two_factor.backup_codes) <= 2
            })

        return Response({
            'success': False,
            'message': 'Invalid verification code'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Update last used
    two_factor.last_used_at = datetime.now()
    two_factor.save()

    return Response({
        'success': True,
        'message': 'Verification successful',
        'user_id': str(user.id)
    })
