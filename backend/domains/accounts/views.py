"""
Account Domain Views
Professional authentication and user management API views
"""

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from django.utils import timezone

from .models import User, UserProfile, UserSettings
from .serializers import (
    CustomTokenObtainPairSerializer,
    LoginSerializer,
    SignupSerializer,
    UserSerializer,
    PasswordChangeSerializer,
    UserProfileSerializer,
    CombinedProfileSerializer,
    UserSettingsSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login view with user data"""
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Update last login time
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Get user from serializer data instead of hardcoding email lookup
            username_field = request.data.get('username') or request.data.get('email')
            if username_field:
                try:
                    # Try to get user by email first, then username
                    if '@' in username_field:
                        user = User.objects.get(email=username_field)
                    else:
                        user = User.objects.get(username=username_field)
                    
                    user.last_login_at = timezone.now()
                    user.save(update_fields=['last_login_at'])
                except User.DoesNotExist:
                    pass  # User not found, but login was successful through serializer
        
        return response


def build_token_response(user):
    """Issue JWT access/refresh tokens + the standard auth payload for a user.

    Shared by the password-login path (no 2FA) and the post-OTP verification path so
    both return an identical session shape to the frontend.
    """
    refresh = RefreshToken.for_user(user)
    access_token = refresh.access_token

    # Add custom claims
    access_token['email'] = user.email
    access_token['role'] = user.role
    access_token['full_name'] = user.full_name
    access_token['organization_id'] = str(user.organization_id) if user.organization else None

    # Update last login
    user.last_login_at = timezone.now()
    user.save(update_fields=['last_login_at'])

    return {
        'user': {
            'id': str(user.id),
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'role': user.role,
            'organizationId': str(user.organization_id) if user.organization else None,
            'permissions': []  # Will be populated with actual permissions
        },
        'tokens': {
            'accessToken': str(access_token),
            'refreshToken': str(refresh),
            'expiresIn': 3600,  # 1 hour
            'tokenType': 'Bearer'
        },
        'sessionId': str(user.id),  # Simple session ID for now
        'expiresAt': timezone.now() + timezone.timedelta(hours=1)
    }


class LoginView(APIView):
    """Login API view"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            user = serializer.validated_data['user']

            # If the user has verified 2FA, require an OTP step before issuing tokens.
            # No tokens are returned here — the client must call /auth/2fa/verify-login/.
            from .models import TwoFactorAuth
            if TwoFactorAuth.objects.filter(user=user, is_verified=True).exists():
                return Response({
                    'requiresOtp': True,
                    'userId': str(user.id),
                    'message': 'Enter the 6-digit code from your authenticator app.'
                }, status=status.HTTP_200_OK)

            return Response(build_token_response(user), status=status.HTTP_200_OK)

        return Response({
            'message': 'Invalid credentials',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class SignupView(APIView):
    """User registration API view"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            return Response({
                'message': 'User created successfully. Please wait for admin approval.',
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'firstName': user.first_name,
                    'lastName': user.last_name,
                    'status': user.status
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'message': 'Registration failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Logout API view"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'message': 'Logout failed',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class RefreshTokenView(TokenRefreshView):
    """Custom token refresh view"""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Add expiration info
            response.data['expiresIn'] = 3600  # 1 hour
            response.data['tokenType'] = 'Bearer'
        
        return response


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile view"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class PasswordChangeView(APIView):
    """Password change view"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'Password change failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """Get current authenticated user"""
    serializer = UserSerializer(request.user)
    return Response({
        'user': serializer.data
    }, status=status.HTTP_200_OK)


class ExtendedProfileView(APIView):
    """Extended user profile management"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get combined user and profile data"""
        user = request.user
        
        # Get or create profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Combine data
        profile_data = {
            'firstName': user.first_name,
            'lastName': user.last_name,
            'email': user.email,
            'phoneNumber': user.phone_number or '',
            'title': user.title or '',
            'department': user.department or '',
            'timezone': user.timezone,
            'language': user.language,
            'barNumber': profile.bar_number or '',
            'licenseStates': profile.license_states or [],
            'specializations': profile.specializations or [],
            'yearsExperience': profile.years_experience,
            'certifications': profile.certifications or [],
            'preferredDatabases': profile.preferred_databases or [],
            'defaultSearchStrategy': profile.default_search_strategy or '',
            'companyName': profile.company_name or '',
            'industry': profile.industry or '',
        }
        
        return Response(profile_data, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update combined user and profile data"""
        user = request.user
        serializer = CombinedProfileSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.update(user, serializer.validated_data)
            
            # Return updated data
            return self.get(request)
        
        return Response({
            'message': 'Profile update failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class UserSettingsView(APIView):
    """User settings management"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user settings"""
        settings, created = UserSettings.objects.get_or_create(
            user=request.user,
            defaults=self._get_default_settings_for_role(request.user.role)
        )
        
        serializer = UserSettingsSerializer(settings)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update user settings"""
        settings, created = UserSettings.objects.get_or_create(user=request.user)
        
        serializer = UserSettingsSerializer(settings, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'Settings update failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_default_settings_for_role(self, role):
        """Get default settings based on user role"""
        defaults = {
            'dark_mode': False,
            'email_notifications': True,
            'push_notifications': True,
        }
        
        if role in ['attorney', 'lead_attorney']:
            defaults.update({
                'attorney_settings': {
                    'billing_rate': 350,
                    'time_tracking_enabled': True,
                    'client_communication_cc': True,
                    'auto_bill_creation': False,
                    'deadline_buffer_days': 5,
                    'billable_hour_alerts': True
                }
            })
        elif role == 'analyst':
            defaults.update({
                'analyst_settings': {
                    'default_databases': ['USPTO', 'EPO'],
                    'search_result_limit': 100,
                    'auto_classification': True,
                    'export_format': 'excel',
                    'citation_alerts': True,
                    'landscape_auto_refresh': True
                }
            })
        elif role in ['admin', 'supervisor']:
            defaults.update({
                'admin_settings': {
                    'system_alerts_enabled': True,
                    'audit_log_retention': 90,
                    'auto_backup_enabled': True,
                    'user_activity_monitoring': True,
                    'bulk_operations_enabled': True,
                    'advanced_reporting': True
                }
            })
        elif role == 'client':
            defaults.update({
                'client_settings': {
                    'invoice_email_notifications': True,
                    'project_status_updates': 'weekly',
                    'communication_preference': 'email',
                    'document_access_level': 'standard',
                    'billing_transparency': True
                }
            })
        
        return defaults


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """API health check endpoint"""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now(),
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)