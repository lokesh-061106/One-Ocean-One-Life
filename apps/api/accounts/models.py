import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from core.choices import CONTRIBUTOR_TYPE_CHOICES


class User(AbstractUser):
    ROLE_CHOICES = [
        ('SUPER_ADMIN', 'Super Admin'),
        ('ADMIN', 'Admin'),
        ('MODERATOR', 'Moderator'),
        ('SCIENTIFIC_VALIDATOR', 'Scientific Validator'),
        ('RESEARCHER', 'Researcher'),
        ('NGO', 'NGO'),
        ('COMMUNITY_ORGANIZATION', 'Community Organization'),
        ('FISHERMAN', 'Fisherman'),
        ('COMMUNITY_MEMBER', 'Community Member'),
        ('VENDOR', 'Vendor'),
        ('TOURISM_PROVIDER', 'Tourism Provider'),
        ('EDUCATOR', 'Educator'),
        ('VOLUNTEER', 'Volunteer'),
        ('GUEST', 'Guest'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    external_id = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text='External source identifier, e.g. spreadsheet Member_ID (M0001)',
    )
    phone = models.CharField(max_length=20, blank=True, db_index=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='COMMUNITY_MEMBER')
    is_verified = models.BooleanField(default=False)
    preferred_language = models.CharField(max_length=10, default='en')

    oauth_provider = models.CharField(max_length=20, blank=True, db_index=True)
    oauth_provider_id = models.CharField(max_length=255, blank=True)

    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    age_range = models.CharField(max_length=20, blank=True)
    languages = models.JSONField(default=list, blank=True)
    skills = models.TextField(blank=True)
    years_of_experience = models.IntegerField(null=True, blank=True)
    areas_of_expertise = models.TextField(blank=True)

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['oauth_provider', 'oauth_provider_id']),
        ]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_oauth_user(self):
        return bool(self.oauth_provider)

    @property
    def age_verified(self):
        if not self.date_of_birth:
            return True
        from datetime import date
        today = date.today()
        age = today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
        return age >= 18


class DeviceToken(models.Model):
    PLATFORM_CHOICES = [
        ('android', 'Android'),
        ('ios', 'iOS'),
        ('web', 'Web'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_tokens')
    device_token = models.CharField(max_length=500)
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'device_tokens'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['device_token']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.platform}"


class Profile(models.Model):
    LOCATION_PRECISION_CHOICES = [
        ('exact', 'Exact'),
        ('approximate', 'Approximate'),
        ('village', 'Village Level'),
        ('district', 'District Level'),
        ('private', 'Private'),
        ('research_only', 'Research Only'),
    ]

    MEMBER_STATUS_CHOICES = [
        ('active', 'Active'),
        ('engaged', 'Engaged'),
        ('occasional', 'Occasional'),
        ('community_member', 'Community Member'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    village = models.ForeignKey(
        'locations.Village',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='residents'
    )
    occupation = models.CharField(max_length=100, blank=True)
    organization = models.CharField(max_length=200, blank=True)
    contributor_type = models.CharField(
        max_length=20,
        choices=CONTRIBUTOR_TYPE_CHOICES,
        blank=True,
        default='',
        help_text='Default "Who are you?" identity pre-selected on every contribution.',
    )
    bio = models.TextField(blank=True)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Optional extra profile data as JSON, e.g. {"awareness_status": "New"}',
    )
    location_precision = models.CharField(
        max_length=20,
        choices=LOCATION_PRECISION_CHOICES,
        default='village'
    )
    contribution_score = models.IntegerField(default=0, db_index=True)
    member_status = models.CharField(
        max_length=20,
        choices=MEMBER_STATUS_CHOICES,
        default='community_member'
    )

    # --- Nearby-contributor map: privacy controls (contributor opts in) ---
    appear_on_map = models.BooleanField(
        default=False,
        help_text='☑ Appear on O3L local contributor map — must be explicit opt-in',
    )
    show_earnings = models.BooleanField(default=False, help_text='Display actual completed earnings publicly')
    show_contribution_counts = models.BooleanField(default=True)
    show_village = models.BooleanField(default=True)
    allow_connection_requests = models.BooleanField(default=True)

    # --- Trust & safety (separate from the contribution score) ---
    TRUST_CHOICES = [
        ('new', 'New'),
        ('trusted', 'Trusted Contributor'),
        ('restricted', 'Restricted'),
        ('suspended', 'Suspended'),
    ]
    trust_status = models.CharField(
        max_length=20, choices=TRUST_CHOICES, default='new', db_index=True
    )
    violation_count = models.IntegerField(default=0)
    upload_restriction_until = models.DateTimeField(null=True, blank=True)

    total_contributions = models.IntegerField(default=0)
    total_verified = models.IntegerField(default=0)
    total_events = models.IntegerField(default=0)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    last_active_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'profiles'
        indexes = [
            models.Index(fields=['contribution_score']),
            models.Index(fields=['member_status']),
            models.Index(fields=['village']),
        ]

    def __str__(self):
        return f"Profile: {self.user.username}"
