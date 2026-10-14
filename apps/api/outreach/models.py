from django.db import models
from core.models import BaseModel


class AwarenessZone(BaseModel):
    """
    One row per coastal location — feeds the red/yellow/green awareness map.

    GREEN  -> many contributors / active
    YELLOW -> moderate participation / needs activation
    RED    -> low awareness / priority outreach
    """

    BAND_CHOICES = [
        ('green', 'Active'),
        ('yellow', 'Needs activation'),
        ('red', 'Priority outreach'),
    ]

    location = models.ForeignKey(
        'locations.Village', on_delete=models.CASCADE, related_name='awareness_zones'
    )
    state = models.CharField(max_length=60, db_index=True)
    district = models.CharField(max_length=100, blank=True)
    coastal_region = models.ForeignKey(
        'locations.CoastalRegion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='awareness_zones',
    )
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    registered_members = models.IntegerField(default=0)
    awareness_reached = models.IntegerField(default=0)
    app_installs = models.IntegerField(default=0)
    first_contributions = models.IntegerField(default=0)
    detailed_contributions = models.IntegerField(default=0)
    verified_contributions = models.IntegerField(default=0)
    marketplace_eligible = models.IntegerField(default=0)
    data_items_sold = models.IntegerField(default=0)
    total_earnings_inr = models.IntegerField(default=0)
    new_awareness_count = models.IntegerField(default=0)
    aware_or_active_count = models.IntegerField(default=0)

    band = models.CharField(max_length=10, choices=BAND_CHOICES, default='red', db_index=True)
    awareness_gap_percent = models.FloatField(default=0)
    recommended_intervention = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = 'awareness_zones'
        ordering = ['state', 'district']
        indexes = [
            models.Index(fields=['band', 'state']),
        ]

    def __str__(self):
        return f"{self.location.name} — {self.get_band_display()}"


class OutreachCampaign(BaseModel):
    """
    How O3L reaches each coastal state: harbour demos, village ambassadors,
    fisherwomen digital circles, fisheries-station partnerships, college networks.
    """

    TYPE_CHOICES = [
        ('harbour', 'Fishing harbour activation'),
        ('village', 'Village activation'),
        ('digital', 'Digital onboarding'),
        ('fisherwomen', 'Fisherwomen digital circle'),
        ('fisheries_station', 'Fisheries-station partnership'),
        ('college', 'College / volunteer network'),
    ]

    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    campaign_id = models.CharField(max_length=20, unique=True)
    state = models.CharField(max_length=60, db_index=True)
    coastal_region = models.ForeignKey(
        'locations.CoastalRegion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='campaigns',
    )
    campaign_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    name = models.CharField(max_length=160)
    delivery_channel = models.CharField(max_length=160, blank=True)
    message = models.TextField(blank=True, help_text='Field message, e.g. "Show 3-step: capture → verify → earn"')
    acquisition_method = models.CharField(max_length=200, blank=True)
    cadence = models.CharField(max_length=40, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    success_target = models.CharField(max_length=160, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'outreach_campaigns'
        ordering = ['state', 'priority']

    def __str__(self):
        return f"{self.state}: {self.name}"


class Ambassador(BaseModel):
    """Trusted local person / volunteer who helps villagers register and contribute."""

    LEVEL_CHOICES = [
        ('level_1', 'Level 1'),
        ('level_2', 'Level 2'),
        ('level_3', 'Level 3'),
    ]

    volunteer_id = models.CharField(max_length=20, unique=True)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ambassador_profile',
    )
    name = models.CharField(max_length=150)
    gender = models.CharField(max_length=20, blank=True)
    primary_skill = models.CharField(max_length=100, blank=True)
    village = models.ForeignKey(
        'locations.Village', on_delete=models.SET_NULL, null=True, blank=True, related_name='ambassadors'
    )
    state = models.CharField(max_length=60, db_index=True)
    district = models.CharField(max_length=100, blank=True)
    coastal_region = models.ForeignKey(
        'locations.CoastalRegion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ambassadors',
    )
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    availability = models.CharField(max_length=40, blank=True)
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='level_1')
    volunteer_type = models.CharField(max_length=60, default='Community Ambassador')
    status = models.CharField(max_length=20, default='Active')
    onboarded_members = models.IntegerField(default=0)

    class Meta:
        db_table = 'ambassadors'
        ordering = ['state', 'name']

    def __str__(self):
        return f"{self.name} ({self.state})"


class ConnectionRequest(BaseModel):
    """New user → nearest trusted contributor ('has anyone from my village earned?')."""

    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('blocked', 'Blocked'),
    ]

    from_user = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='connection_requests_sent'
    )
    to_user = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='connection_requests_received'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    purpose = models.CharField(max_length=160, blank=True, default='Friend/mentor connection')
    distance_km = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'connection_requests'
        ordering = ['-created_at']
        unique_together = ['from_user', 'to_user']

    def __str__(self):
        return f"{self.from_user_id} → {self.to_user_id} ({self.status})"


class Referral(BaseModel):
    """Village ambassador / friend referral programme — 50 pts on first verified contribution."""

    STATUS_CHOICES = [
        ('pending', 'Pending qualification'),
        ('qualified', 'Completed first verified contribution'),
        ('rejected', 'Rejected'),
    ]

    referrer = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='referrals_made'
    )
    referred_user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referrals_received',
    )
    referral_code = models.CharField(max_length=30, db_index=True)
    relationship = models.CharField(max_length=120, blank=True)
    acquisition_method = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    points_awarded = models.IntegerField(default=50)

    class Meta:
        db_table = 'referrals'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.referral_code} ({self.status})"
