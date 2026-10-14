from django.db import models
from core.models import BaseModel


class RecognitionAward(BaseModel):
    CATEGORY_CHOICES = [
        ('fisherman', 'Fisherman'),
        ('ocean_observer', 'Ocean Observer'),
        ('marine_guardian', 'Marine Guardian'),
        ('data_contributor', 'Data Contributor'),
        ('knowledge_keeper', 'Coastal Knowledge Keeper'),
        ('community_champion', 'Community Champion'),
        ('event_organizer', 'Event Organizer'),
        ('ocean_educator', 'Ocean Educator'),
        ('sustainable_family', 'Sustainable Family'),
        ('coastal_enterprise', 'Coastal Enterprise'),
        ('livelihood_champion', 'Livelihood Champion'),
        ('community_partner', 'Community Partner'),
        ('conservation_partner', 'Conservation Partner'),
        ('knowledge_partner', 'Knowledge Partner'),
        ('sustainable_business', 'Sustainable Business Partner'),
    ]

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='recognition_awards')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    year = models.IntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)
    zone = models.ForeignKey('locations.Zone', on_delete=models.SET_NULL, null=True, blank=True)
    score = models.FloatField(default=0)
    rank = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'recognition_awards'
        ordering = ['-year', '-score']
        indexes = [
            models.Index(fields=['year', 'category']),
            models.Index(fields=['user', 'year']),
        ]

    def __str__(self):
        return f"{self.user.username} — {self.title} ({self.year})"


class TierThreshold(BaseModel):
    """Bronze 10 / Silver 25 / Gold 50 / Platinum 100 / Ocean Guardian 250 verified."""

    key = models.SlugField(unique=True, help_text='e.g. bronze, silver, gold')
    name = models.CharField(max_length=60)
    min_verified = models.IntegerField(default=0)
    min_points = models.IntegerField(default=0)
    color = models.CharField(max_length=20, default='#CD7F32')
    icon = models.CharField(max_length=10, blank=True)
    unlocks = models.TextField(blank=True, help_text='What this tier unlocks')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'tier_thresholds'
        ordering = ['order']

    def __str__(self):
        return f"{self.name} (>={self.min_verified})"


class BadgeDefinition(BaseModel):
    key = models.SlugField(unique=True)
    name = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, blank=True)
    color = models.CharField(max_length=20, default='#087EA4')
    criteria = models.TextField(blank=True, help_text='Human readable award rule')

    class Meta:
        db_table = 'badge_definitions'
        ordering = ['name']

    def __str__(self):
        return self.name


class ContributionScore(BaseModel):
    """
    One row per user — the scoreboard record.

    total_score      = B x Q x V x I points total (primary ranking number)
    profile_score    = legacy 7-factor weighted score 0..100 (secondary metric)
    earnings_inr     = completed DataSale payouts to this contributor
    """

    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='contribution_scores')
    total_score = models.IntegerField(default=0, db_index=True, help_text='B x Q x V x I points')
    profile_score = models.FloatField(default=0, help_text='7-factor weighted profile strength 0..100')
    verified_contributions = models.IntegerField(default=0)
    total_contributions = models.IntegerField(default=0)
    quality_average = models.FloatField(default=0)
    breakdown = models.JSONField(
        default=dict,
        blank=True,
        help_text='{"b":..,"q":..,"v":..,"i":..,"profile":{...}}',
    )

    # Geography denormalised for fast state / region boards
    state = models.CharField(max_length=60, blank=True, db_index=True)
    coastal_region = models.ForeignKey(
        'locations.CoastalRegion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='scores',
    )

    # Marketplace earnings
    data_items_sold = models.IntegerField(default=0)
    gross_sales_inr = models.IntegerField(default=0)
    earnings_inr = models.IntegerField(default=0, help_text='Completed payouts after platform fee')
    marketplace_eligible = models.BooleanField(default=False, help_text='25 verified contributions reached')
    agency_referrals = models.IntegerField(default=0)

    # Recognition
    slug = models.SlugField(max_length=80, unique=True, blank=True, db_index=True)
    tier = models.SlugField(blank=True, default='new')
    badges = models.JSONField(default=list, blank=True)
    rank = models.IntegerField(null=True, blank=True)
    prev_rank = models.IntegerField(null=True, blank=True)
    rank_movement = models.IntegerField(default=0, help_text='positive = moved up, negative = moved down')

    last_calculated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contribution_scores'
        ordering = ['-total_score']
        indexes = [
            models.Index(fields=['-total_score', 'state']),
            models.Index(fields=['tier']),
        ]

    def __str__(self):
        return f"{self.user.username} — Score: {self.total_score}"

    def _generate_slug(self):
        """Readable, stable, collision-free: `lakshmi-r-f37216`.

        Display names collide heavily in this dataset (122 duplicates in the
        first 200 rows), so a bare name slug cannot be made unique without
        unstable counters. A short id suffix keeps it readable, unique and
        permanently stable as new contributors are added.
        """
        from django.utils.text import slugify

        user = self.user
        name = f"{user.first_name} {user.last_name}".strip() or user.username
        base = slugify(name)[:56].strip('-') or slugify(user.username)[:56].strip('-') or 'contributor'
        return f"{base}-{str(user.id)[:6]}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)

    @property
    def rank_delta(self):
        if self.prev_rank is None or self.rank is None:
            return 0
        return self.prev_rank - self.rank


class LeaderboardSnapshot(BaseModel):
    """Historical rank per level so the UI can show ↑ / ↓ movement."""

    LEVEL_CHOICES = [
        ('individual', 'Individual'),
        ('village', 'Village'),
        ('district', 'District'),
        ('state', 'State'),
        ('region', 'Coastal Region'),
        ('zone', 'Zone'),
    ]

    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, db_index=True)
    scope_key = models.CharField(max_length=64, db_index=True, help_text='village/district/state/region slug')
    scope_label = models.CharField(max_length=120, blank=True)
    subject_id = models.CharField(max_length=64, db_index=True, help_text='user id or scope key of entry')
    subject_name = models.CharField(max_length=150, blank=True)
    rank = models.IntegerField()
    total_score = models.IntegerField(default=0)
    earnings_inr = models.IntegerField(default=0)
    captured_on = models.DateField(db_index=True)

    class Meta:
        db_table = 'leaderboard_snapshots'
        ordering = ['level', 'scope_key', 'rank']
        indexes = [
            models.Index(fields=['level', 'scope_key', 'captured_on']),
        ]
        unique_together = ['level', 'scope_key', 'subject_id', 'captured_on']

    def __str__(self):
        return f"{self.level}/{self.scope_key} #{self.rank} {self.subject_name}"
