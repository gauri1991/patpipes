"""
Attorney Network Admin Interface
"""

from django.contrib import admin
from .models import LawFirm, Attorney, AttorneyReview, AttorneyConnection


@admin.register(LawFirm)
class LawFirmAdmin(admin.ModelAdmin):
    """Admin interface for law firms"""

    list_display = [
        'name', 'city', 'country', 'firm_size',
        'rating', 'review_count', 'is_verified', 'is_active'
    ]
    list_filter = ['firm_size', 'country', 'is_verified', 'is_active', 'established_year']
    search_fields = ['name', 'city', 'country', 'description']
    readonly_fields = ['id', 'rating', 'review_count', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'website', 'email', 'phone')
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'country', 'postal_code')
        }),
        ('Organization Details', {
            'fields': ('firm_size', 'established_year', 'description', 'practice_areas', 'technology_focus')
        }),
        ('Ratings & Reviews', {
            'fields': ('rating', 'review_count')
        }),
        ('Status', {
            'fields': ('is_verified', 'is_active')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Attorney)
class AttorneyAdmin(admin.ModelAdmin):
    """Admin interface for attorneys"""

    list_display = [
        'full_name', 'email', 'law_firm', 'experience_level',
        'rating', 'review_count', 'is_verified', 'is_featured', 'is_active'
    ]
    list_filter = [
        'experience_level', 'independent', 'is_verified',
        'is_featured', 'is_active', 'accepting_new_clients'
    ]
    search_fields = [
        'first_name', 'last_name', 'email', 'registration_number',
        'law_firm__name', 'law_school'
    ]
    readonly_fields = ['id', 'full_name', 'rating', 'review_count', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'first_name', 'last_name', 'email', 'phone', 'profile_photo')
        }),
        ('Professional Details', {
            'fields': ('title', 'law_firm', 'independent')
        }),
        ('Credentials', {
            'fields': ('bar_admissions', 'registration_number', 'admitted_year')
        }),
        ('Education', {
            'fields': ('law_school', 'law_school_grad_year', 'undergraduate', 'technical_degree')
        }),
        ('Experience', {
            'fields': ('experience_level', 'years_of_experience')
        }),
        ('Specializations', {
            'fields': ('specializations', 'technology_areas', 'industries_served')
        }),
        ('Profile', {
            'fields': ('bio', 'linkedin_url', 'languages')
        }),
        ('Practice Statistics', {
            'fields': (
                'cases_handled', 'patents_drafted', 'patents_granted', 'success_rate'
            )
        }),
        ('Availability & Rates', {
            'fields': (
                'hourly_rate_min', 'hourly_rate_max',
                'accepting_new_clients', 'available_for_consultation', 'consultation_fee'
            )
        }),
        ('Ratings & Reviews', {
            'fields': ('rating', 'review_count')
        }),
        ('Status', {
            'fields': ('is_verified', 'is_featured', 'is_active')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AttorneyReview)
class AttorneyReviewAdmin(admin.ModelAdmin):
    """Admin interface for attorney reviews"""

    list_display = [
        'attorney', 'reviewer', 'rating', 'title',
        'is_verified', 'is_approved', 'is_flagged', 'created_at'
    ]
    list_filter = [
        'rating', 'is_verified', 'is_approved', 'is_flagged', 'would_recommend'
    ]
    search_fields = ['attorney__first_name', 'attorney__last_name', 'title', 'review_text']
    readonly_fields = ['id', 'created_at', 'updated_at']

    fieldsets = (
        ('Review Details', {
            'fields': ('attorney', 'reviewer', 'rating', 'title', 'review_text')
        }),
        ('Rating Breakdown', {
            'fields': (
                'communication_rating', 'expertise_rating',
                'value_rating', 'responsiveness_rating'
            )
        }),
        ('Service Details', {
            'fields': ('service_type', 'service_date', 'would_recommend')
        }),
        ('Moderation', {
            'fields': ('is_verified', 'is_approved', 'is_flagged')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AttorneyConnection)
class AttorneyConnectionAdmin(admin.ModelAdmin):
    """Admin interface for attorney connections"""

    list_display = [
        'user', 'attorney', 'status', 'connection_type',
        'requested_date', 'responded_date'
    ]
    list_filter = ['status', 'connection_type', 'requested_date']
    search_fields = [
        'user__email', 'attorney__first_name', 'attorney__last_name',
        'message', 'response'
    ]
    readonly_fields = ['id', 'requested_date', 'created_at', 'updated_at']

    fieldsets = (
        ('Parties', {
            'fields': ('user', 'attorney')
        }),
        ('Connection Details', {
            'fields': ('status', 'connection_type', 'message', 'response')
        }),
        ('Dates', {
            'fields': (
                'requested_date', 'responded_date',
                'engagement_start_date', 'engagement_end_date'
            )
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
