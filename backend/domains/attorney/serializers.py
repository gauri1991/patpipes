"""
Attorney Network Serializers
"""

from rest_framework import serializers
from .models import LawFirm, Attorney, AttorneyReview, AttorneyConnection, AttorneySnapshot
from domains.accounts.serializers import UserSerializer


class LawFirmSerializer(serializers.ModelSerializer):
    """Serializer for law firm profiles"""

    created_by = UserSerializer(read_only=True)
    attorney_count = serializers.SerializerMethodField()
    display_name = serializers.ReadOnlyField()

    class Meta:
        model = LawFirm
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'rating', 'review_count')

    def get_attorney_count(self, obj):
        """Get number of attorneys in the firm"""
        return obj.attorneys.filter(is_active=True).count()


class AttorneySerializer(serializers.ModelSerializer):
    """Serializer for attorney profiles"""

    user = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    law_firm = LawFirmSerializer(read_only=True)
    law_firm_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    full_name = serializers.ReadOnlyField()
    is_uspto_verified = serializers.SerializerMethodField()

    class Meta:
        model = Attorney
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'rating', 'review_count', 'full_name')

    def get_is_uspto_verified(self, obj):
        return obj.source == 'uspto_roster' and obj.is_verified


class AttorneyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for attorney listings"""

    law_firm_name = serializers.CharField(source='law_firm.display_name', read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Attorney
        fields = [
            'id', 'full_name', 'first_name', 'last_name', 'email', 'title',
            'law_firm_name', 'independent', 'experience_level', 'years_of_experience',
            'specializations', 'technology_areas', 'rating', 'review_count',
            'hourly_rate_min', 'hourly_rate_max', 'accepting_new_clients',
            'is_verified', 'is_featured', 'profile_photo',
            'source', 'practitioner_type', 'city', 'state', 'country',
            'registration_number',
        ]


class AttorneyReviewSerializer(serializers.ModelSerializer):
    """Serializer for attorney reviews"""

    reviewer = UserSerializer(read_only=True)
    attorney_name = serializers.CharField(source='attorney.full_name', read_only=True)

    class Meta:
        model = AttorneyReview
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'is_approved')


class AttorneyConnectionSerializer(serializers.ModelSerializer):
    """Serializer for attorney connections"""

    user = UserSerializer(read_only=True)
    attorney = AttorneyListSerializer(read_only=True)
    attorney_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = AttorneyConnection
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'requested_date', 'responded_date')


class AttorneySnapshotSerializer(serializers.ModelSerializer):
    """Serializer for historical attorney snapshots"""

    class Meta:
        model = AttorneySnapshot
        fields = [
            'id', 'registration_number', 'snapshot_date',
            'first_name', 'last_name', 'middle_initial', 'suffix',
            'firm_name', 'firm_line_2',
            'street_address', 'address_line_2', 'city', 'state',
            'country', 'postal_code', 'phone',
            'practitioner_type', 'govt_employee',
        ]


class AttorneySearchSerializer(serializers.Serializer):
    """Serializer for attorney search parameters"""

    query = serializers.CharField(required=False)
    specialization = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    technology_area = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    bar_admission = serializers.CharField(required=False)
    experience_level = serializers.ChoiceField(
        choices=Attorney.EXPERIENCE_LEVEL_CHOICES,
        required=False
    )
    min_rating = serializers.DecimalField(
        max_digits=3,
        decimal_places=2,
        required=False
    )
    hourly_rate_max = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False
    )
    accepting_new_clients = serializers.BooleanField(required=False)
    is_verified = serializers.BooleanField(required=False)
    city = serializers.CharField(required=False)
    state = serializers.CharField(required=False)
    country = serializers.CharField(required=False)
