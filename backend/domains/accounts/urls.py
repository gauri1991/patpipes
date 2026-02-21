"""
Account Domain URLs
Professional authentication API endpoints
"""

from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from . import permission_views

app_name = 'accounts'

# Import auth_views for password reset endpoints
from . import auth_views
from . import twofa_views

# Authentication URLs
auth_patterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('signup/', views.SignupView.as_view(), name='signup'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('refresh/', views.RefreshTokenView.as_view(), name='token_refresh'),
    path('change-password/', views.PasswordChangeView.as_view(), name='change_password'),
    # Password reset endpoints
    path('forgot-password/', auth_views.forgot_password_request, name='forgot_password'),
    path('verify-reset-code/', auth_views.verify_reset_code, name='verify_reset_code'),
    path('reset-password/', auth_views.reset_password, name='reset_password'),
    path('resend-reset-code/', auth_views.resend_reset_code, name='resend_reset_code'),
    # Two-Factor Authentication endpoints
    path('2fa/setup/', twofa_views.setup_2fa, name='2fa_setup'),
    path('2fa/verify/', twofa_views.verify_2fa, name='2fa_verify'),
    path('2fa/disable/', twofa_views.disable_2fa, name='2fa_disable'),
    path('2fa/status/', twofa_views.get_2fa_status, name='2fa_status'),
    path('2fa/backup-codes/', twofa_views.regenerate_backup_codes, name='2fa_backup_codes'),
    path('2fa/verify-login/', twofa_views.verify_2fa_login, name='2fa_verify_login'),
]

# User URLs
user_patterns = [
    path('me/', views.current_user, name='current_user'),
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('profile/extended/', views.ExtendedProfileView.as_view(), name='extended_profile'),
    path('settings/', views.UserSettingsView.as_view(), name='user_settings'),
]

# Permission Management URLs
permission_patterns = [
    path('roles/matrix/', permission_views.RolePermissionMatrixView.as_view(), name='role_permission_matrix'),
    path('users/list/', permission_views.UserListView.as_view(), name='users_list'),
    path('users/<uuid:user_id>/', permission_views.UserPermissionView.as_view(), name='user_permissions'),
    path('options/', permission_views.PermissionOptionsView.as_view(), name='permission_options'),
    path('check/<str:permission_name>/', permission_views.check_permission, name='check_permission'),
    path('audit-logs/', permission_views.PermissionAuditLogView.as_view(), name='audit_logs'),
]

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),

    # Authentication endpoints
    path('auth/', include(auth_patterns)),

    # User endpoints
    path('users/', include(user_patterns)),

    # Permission management endpoints
    path('permissions/', include(permission_patterns)),
]