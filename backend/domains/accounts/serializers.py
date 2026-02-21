"""
Account Domain Serializers
Professional API serializers for user management
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import (
    User, Organization, Team, AttorneyProfile, UserProfile, UserSettings,
    Permission, WorkflowUserPermission, DataConfigurationPermission
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'title', 'department', 'role', 'status',
            'theme_preference', 'language', 'timezone', 'avatar',
            'created_at', 'updated_at', 'last_login_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login_at']


class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for Organization model"""
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'domain', 'industry', 'size', 'logo',
            'sso_enabled', 'mfa_required', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with user details"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Allow both username and email fields
        self.fields['username'] = serializers.CharField()
        self.fields['email'] = serializers.CharField(required=False)  # Make email optional
        self.fields['password'] = serializers.CharField()
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        token['organization_id'] = str(user.organization_id) if user.organization else None
        
        return token
    
    def validate(self, attrs):
        # Use either username or email field
        username = attrs.get('username') or attrs.get('email')
        password = attrs.get('password')
        
        if username and password:
            # Use our custom authenticate method
            user = authenticate(
                request=self.context.get('request'),
                username=username,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError('No active account found with the given credentials')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
                
            # Set the user for token generation
            self.user = user
            
            # Generate tokens
            refresh = self.get_token(user)
            
            data = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
            
            # Add user data to response
            data['user'] = {
                'id': str(user.id),
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'role': user.role,
                'organizationId': str(user.organization_id) if user.organization else None,
                'permissions': []  # Will be populated with actual permissions
            }
            
            return data
        
        raise serializers.ValidationError('Must include username/email and password')


class LoginSerializer(serializers.Serializer):
    """Login serializer that accepts either username or email"""

    username = serializers.CharField(required=False)  # Can be username or email
    email = serializers.CharField(required=False)     # Alternative field name
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        # Accept either 'username' or 'email' field
        identifier = attrs.get('username') or attrs.get('email')
        password = attrs.get('password')

        if identifier and password:
            user = authenticate(
                request=self.context.get('request'),
                username=identifier,
                password=password
            )

            if not user:
                raise serializers.ValidationError(
                    'Unable to log in with provided credentials.'
                )

            if not user.is_active:
                raise serializers.ValidationError(
                    'User account is disabled.'
                )

            if user.status != User.Status.ACTIVE:
                raise serializers.ValidationError(
                    'User account is not active. Please contact administrator.'
                )

            attrs['user'] = user
            return attrs

        raise serializers.ValidationError(
            'Must include "username" or "email" and "password".'
        )


class SignupSerializer(serializers.ModelSerializer):
    """User registration serializer"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    organization_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name', 
            'last_name', 'organization_name'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        organization_name = validated_data.pop('organization_name', None)
        
        # Create organization if provided
        organization = None
        if organization_name:
            organization, created = Organization.objects.get_or_create(
                name=organization_name,
                defaults={
                    'domain': organization_name.lower().replace(' ', '-'),
                    'industry': 'other',
                    'size': 'small'
                }
            )
        
        # Create user
        user = User.objects.create_user(
            organization=organization,
            status=User.Status.PENDING,  # Requires admin approval
            **validated_data
        )
        
        return user


class PasswordChangeSerializer(serializers.Serializer):
    """Password change serializer"""
    
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {"new_password": "Password fields didn't match."}
            )
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates"""
    
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 'title', 
            'department', 'avatar', 'theme_preference', 'language', 
            'timezone', 'organization_name'
        ]
    
    def update(self, instance, validated_data):
        # Update user profile
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save(update_fields=validated_data.keys())
        return instance


class ExtendedUserProfileSerializer(serializers.ModelSerializer):
    """Serializer for extended user profile with role-specific fields"""
    
    class Meta:
        model = UserProfile
        fields = [
            'bar_number', 'license_states', 'specializations', 'years_experience',
            'certifications', 'preferred_databases', 'default_search_strategy',
            'company_name', 'industry', 'hourly_rate', 'bio'
        ]


class UserSettingsSerializer(serializers.ModelSerializer):
    """Serializer for user settings and preferences"""
    
    class Meta:
        model = UserSettings
        fields = [
            'dark_mode', 'compact_view', 'auto_save', 'keyboard_shortcuts',
            'email_notifications', 'push_notifications', 'sms_notifications',
            'project_updates', 'deadline_alerts', 'team_mentions',
            'marketing_emails', 'weekly_digest', 'profile_visibility',
            'activity_tracking', 'data_sharing', 'analytics_opt_in',
            'working_hours_start', 'working_hours_end', 'break_reminders',
            'focus_mode', 'attorney_settings', 'analyst_settings',
            'admin_settings', 'client_settings', 'two_factor_enabled',
            'session_timeout', 'auto_logout', 'login_notifications'
        ]


class CombinedProfileSerializer(serializers.Serializer):
    """Combined serializer for user profile and extended profile data"""
    
    # Basic user fields
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField(read_only=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    timezone = serializers.CharField()
    language = serializers.CharField()
    
    # Extended profile fields
    bar_number = serializers.CharField(required=False, allow_blank=True)
    license_states = serializers.ListField(
        child=serializers.CharField(), 
        required=False, 
        allow_empty=True
    )
    specializations = serializers.ListField(
        child=serializers.CharField(), 
        required=False, 
        allow_empty=True
    )
    years_experience = serializers.IntegerField(required=False, allow_null=True)
    certifications = serializers.ListField(
        child=serializers.CharField(), 
        required=False, 
        allow_empty=True
    )
    preferred_databases = serializers.ListField(
        child=serializers.CharField(), 
        required=False, 
        allow_empty=True
    )
    default_search_strategy = serializers.CharField(required=False, allow_blank=True)
    company_name = serializers.CharField(required=False, allow_blank=True)
    industry = serializers.CharField(required=False, allow_blank=True)
    
    def update(self, instance, validated_data):
        # Update basic user fields
        user_fields = ['first_name', 'last_name', 'phone_number', 'title', 'department', 'timezone', 'language']
        for field in user_fields:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()
        
        # Update or create extended profile
        profile_fields = [
            'bar_number', 'license_states', 'specializations', 'years_experience',
            'certifications', 'preferred_databases', 'default_search_strategy',
            'company_name', 'industry'
        ]
        
        profile_data = {field: validated_data[field] for field in profile_fields if field in validated_data}
        
        if profile_data:
            profile, created = UserProfile.objects.get_or_create(
                user=instance,
                defaults=profile_data
            )
            if not created:
                for field, value in profile_data.items():
                    setattr(profile, field, value)
                profile.save()
        
        return instance