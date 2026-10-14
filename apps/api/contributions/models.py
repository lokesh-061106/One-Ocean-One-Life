import uuid as uuid_mod

from django.contrib.gis.db import models as gis_models
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from core.choices import CONTRIBUTOR_TYPE_CHOICES
from core.models import BaseModel


class ContributionType(BaseModel):
    REWARD_CHANNELS = [
        ('marketplace', 'Marketplace'),
        ('agency_referral', 'Agency Referral (no public price)'),
    ]

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    points_verified = models.IntegerField(default=10)
    points_submitted = models.IntegerField(default=5)
    catalogue_id = models.CharField(
        max_length=10,
        blank=True,
        db_index=True,
        help_text='Workbook Contribution_Type_ID, e.g. CT01',
    )
    base_points_b = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=10,
        help_text='B — base points multiplied by Q x V x I to give Final Score',
    )
    fixed_price_inr = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Marketplace price in INR, e.g. 100 for a good photograph. Null = not for sale.',
    )
    reward_channel = models.CharField(
        max_length=20,
        choices=REWARD_CHANNELS,
        default='marketplace',
    )
    marketplace_eligible = models.BooleanField(
        default=True,
        help_text='May be listed for sale once the contributor has 25 verified contributions',
    )
    requires_geotag = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'contribution_types'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def price_display(self):
        if self.reward_channel == 'agency_referral':
            return 'Agency referral reward'
        if self.fixed_price_inr is None:
            return 'Not for sale'
        return f"₹{self.fixed_price_inr:g}"


class Contribution(BaseModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('auto_validated', 'Auto Validated'),
        ('moderator_review', 'Moderator Review'),
        ('scientific_review', 'Scientific Review'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('duplicate', 'Duplicate'),
    ]

    TYPE_CHOICES = [
        ('ocean_sound', 'Ocean Sound'),
        ('marine_sighting', 'Marine Sighting'),
        ('fish_catch', 'Fish Catch'),
        ('education_post', 'Education Post'),
        ('event', 'Event'),
        ('beach_cleanup', 'Beach Cleanup'),
        ('local_knowledge', 'Local Knowledge'),
        ('observation', 'Observation'),
    ]

    PRIMARY_TYPES = ('ocean_sound', 'marine_sighting', 'fish_catch')

    SAFETY_CHOICES = [
        ('SAFE', 'Safe'),
        ('QUARANTINED', 'Quarantined'),
        ('REJECTED', 'Rejected'),
        ('PENDING', 'Pending screening'),
    ]

    RELEVANCE_CHOICES = [
        ('unclear', 'Unclear / weakly relevant'),
        ('relevant', 'Relevant'),
        ('highly_relevant', 'Highly relevant'),
        ('unrelated', 'Clearly unrelated'),
    ]

    MODERATION_CHOICES = [
        ('PENDING', 'Pending'),
        ('AI_SCREENING', 'AI Screening'),
        ('SAFE_AUTO_PASS', 'Safe — auto pass'),
        ('HUMAN_REVIEW', 'Human review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('REMOVED_AFTER_REPORT', 'Removed after report'),
        ('APPEAL_PENDING', 'Appeal pending'),
        ('APPEAL_APPROVED', 'Appeal approved'),
    ]

    VISIBILITY_CHOICES = [
        ('PRIVATE', 'Private'),
        ('UNDER_REVIEW', 'Under review'),
        ('COMMUNITY_VISIBLE', 'Community visible'),
        ('MARKETPLACE_VISIBLE', 'Marketplace visible'),
        ('REMOVED', 'Removed'),
    ]

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='contributions')
    external_id = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text='External source identifier, e.g. spreadsheet Contribution_ID (C00001)',
    )
    title = models.CharField(max_length=255, blank=True, db_index=True)
    slug = models.SlugField(
        max_length=280,
        unique=True,
        blank=True,
        help_text='URL-friendly identifier generated from the title.',
    )
    author = models.CharField(
        max_length=150,
        blank=True,
        help_text='Display author name. Defaults to the contributor username when blank.',
    )
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, db_index=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='draft', db_index=True)
    contributor_type = models.CharField(
        max_length=20,
        choices=CONTRIBUTOR_TYPE_CHOICES,
        blank=True,
        default='',
        db_index=True,
        help_text='"Who are you?" — falls back to the profile default when blank.',
    )
    location = gis_models.PointField(srid=4326, null=True, blank=True)
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)
    zone = models.ForeignKey('locations.Zone', on_delete=models.SET_NULL, null=True, blank=True)
    location_precision = models.CharField(max_length=20, default='exact')
    quality_score = models.FloatField(default=0)
    points = models.IntegerField(default=0)

    # Scoring multipliers — Final Score = B x Q x V x I (R is a publication gate only)
    catalogue_type = models.ForeignKey(
        ContributionType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contributions',
        help_text='Catalogue entry (CT01..CT12) that supplies base points B and price',
    )
    base_points = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=10,
        help_text='B — base points for this contribution type',
    )
    q_quality = models.DecimalField(max_digits=4, decimal_places=2, default=1, help_text='Q 0.50–1.50')
    v_verification = models.DecimalField(max_digits=4, decimal_places=2, default=1, help_text='V 0.50–2.00')
    i_impact = models.DecimalField(max_digits=4, decimal_places=2, default=1, help_text='I 1.00–2.00')
    r_relevance = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1,
        help_text='R 0.50–1.50 publication gate only — NOT multiplied into the score',
    )
    final_score_points = models.FloatField(
        default=0,
        db_index=True,
        help_text='B x Q x V x I — leaderboard points',
    )
    evidence_type = models.CharField(max_length=30, blank=True, help_text='Photo / Audio / Video / Text')

    # Upload != PUBLISH safety & moderation pipeline
    safety_status = models.CharField(
        max_length=20, choices=SAFETY_CHOICES, default='PENDING', db_index=True
    )
    safety_category = models.CharField(max_length=120, blank=True)
    relevance_level = models.CharField(
        max_length=20, choices=RELEVANCE_CHOICES, default='relevant', blank=True
    )
    moderation_decision = models.CharField(
        max_length=30, choices=MODERATION_CHOICES, default='PENDING', db_index=True
    )
    visibility_status = models.CharField(
        max_length=25, choices=VISIBILITY_CHOICES, default='PRIVATE', db_index=True
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderation_reviews',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=200, blank=True)
    appeal_status = models.CharField(max_length=30, blank=True)
    report_count = models.IntegerField(default=0)
    submitted_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_contributions',
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Optional extra data as JSON, e.g. {"species": "Blue Whale", "behavior": "feeding"}',
    )
    notes = models.TextField(blank=True)
    description = models.TextField(
        blank=True,
        help_text='Rich-text (HTML) long description produced by the editor.',
    )

    class Meta:
        db_table = 'contributions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'type']),
            models.Index(fields=['status', 'type']),
            models.Index(fields=['village', 'status']),
            models.Index(fields=['visibility_status', 'moderation_decision']),
            models.Index(fields=['final_score_points']),
        ]

    def __str__(self):
        return f"{self.user.username} — {self.get_type_display()} ({self.status})"

    def _generate_slug(self):
        base = slugify(self.title)[:200].strip('-')
        if not base:
            base = f"contribution-{str(self.pk or self.external_id or uuid_mod.uuid4())[:8]}"
        slug = base
        suffix = 1
        while Contribution.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            suffix += 1
            slug = f"{base}-{suffix}"
        return slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)

    @property
    def score_formula_display(self):
        return f"{self.base_points:g} × {self.q_quality:g} × {self.v_verification:g} × {self.i_impact:g}"

    @property
    def is_public(self):
        return self.visibility_status in ('COMMUNITY_VISIBLE', 'MARKETPLACE_VISIBLE')

    @property
    def relevance_gate(self):
        """R = 0 rejects, 0.5 sends to human review, 1.0/1.5 continue publication."""
        if self.relevance_level == 'unrelated' or self.r_relevance <= 0:
            return 'reject'
        if self.r_relevance < 1:
            return 'review'
        return 'continue'


class ContentReport(BaseModel):
    """🚩 Report button on every publicly visible contribution."""

    CATEGORY_CHOICES = [
        ('sexual', 'Sexual / inappropriate'),
        ('violence', 'Violence / gore'),
        ('harassment', 'Harassment'),
        ('spam', 'Spam'),
        ('fake_data', 'Fake / fabricated data'),
        ('wrong_location', 'Wrong location'),
        ('copyright', 'Copyright concern'),
        ('private_info', 'Personal / private information'),
        ('dangerous', 'Dangerous content'),
        ('other', 'Other'),
    ]

    contribution = models.ForeignKey(
        Contribution, on_delete=models.CASCADE, related_name='reports'
    )
    reporter = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='content_reports',
    )
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    notes = models.TextField(blank=True)
    is_actioned = models.BooleanField(default=False)
    action_taken = models.CharField(max_length=120, blank=True)

    class Meta:
        db_table = 'content_reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'is_actioned']),
        ]

    def __str__(self):
        return f"{self.category} — {self.contribution_id}"


class VerificationLevel(BaseModel):
    name = models.CharField(max_length=50)
    order = models.IntegerField(unique=True)
    required_role = models.CharField(max_length=30, blank=True)
    auto_approve = models.BooleanField(default=False)
    requires_evidence = models.BooleanField(default=True)
    confidence_threshold = models.IntegerField(default=70)

    class Meta:
        db_table = 'verification_levels'
        ordering = ['order']

    def __str__(self):
        return f"{self.order}. {self.name}"


class VerificationRequest(BaseModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_info', 'Needs More Info'),
    ]

    contribution = models.ForeignKey(
        Contribution,
        on_delete=models.CASCADE,
        related_name='verification_requests',
    )
    level = models.ForeignKey(
        VerificationLevel,
        on_delete=models.CASCADE,
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verification_reviews',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    confidence_score = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    evidence = models.JSONField(default=list, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'verification_requests'
        indexes = [
            models.Index(fields=['status', 'level']),
            models.Index(fields=['contribution', 'status']),
        ]

    def __str__(self):
        return f"Verification for {self.contribution.id} - {self.level.name}"


class VerificationHistory(BaseModel):
    contribution = models.ForeignKey(
        Contribution,
        on_delete=models.CASCADE,
        related_name='verification_history',
    )
    action = models.CharField(max_length=20)
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    notes = models.TextField(blank=True)
    confidence_score = models.IntegerField(default=0)

    class Meta:
        db_table = 'verification_history'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.contribution.id}: {self.from_status} -> {self.to_status}"


def contribution_media_upload_path(instance, filename):
    return f'contributions/{instance.kind}s/{filename}'


class ContributionMedia(BaseModel):
    KIND_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('document', 'Document'),
    ]

    ROLE_CHOICES = [
        ('general', 'General'),
        ('location_photo', 'Location photo'),
        ('setup_photo', 'Recording setup photo'),
        ('species_photo', 'Species photo'),
        ('primary_audio', 'Primary audio'),
        ('voice_note', 'Voice note'),
        ('video', 'Video'),
        ('document', 'Document'),
        ('spectrogram', 'Spectrogram'),
    ]

    ALLOWED_DOCUMENT_EXTENSIONS = (
        'pdf', 'doc', 'docx', 'docm', 'dot', 'dotx', 'dotm',
        'xls', 'xlsx', 'xlsm', 'xlsb', 'csv',
        'ppt', 'pptx', 'pps', 'ppsx',
        'txt', 'rtf', 'odt', 'ods', 'odp',
    )

    contribution = models.ForeignKey(
        Contribution,
        on_delete=models.CASCADE,
        related_name='media',
    )
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, db_index=True)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='general',
        db_index=True,
        help_text='What this file is evidence of (location, setup, species, voice note, ...).',
    )
    file = models.FileField(upload_to=contribution_media_upload_path)
    name = models.CharField(
        max_length=200,
        blank=True,
        help_text='Display name. Leave blank to use the uploaded file name.',
    )
    caption = models.CharField(max_length=255, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'contribution_media'
        ordering = ['kind', 'order', 'created_at']
        indexes = [
            models.Index(fields=['contribution', 'kind']),
        ]

    def __str__(self):
        return f'{self.contribution_id} — {self.kind}: {self.display_name}'

    @property
    def display_name(self):
        if self.name:
            return self.name
        return self.file.name.rsplit('/', 1)[-1] if self.file else 'File'

    @property
    def file_size(self):
        try:
            return self.file.size
        except (OSError, ValueError):
            return 0


class PendingContribution(Contribution):
    """Proxy model: review queue shown as its own section in the Django admin."""

    class Meta:
        proxy = True
        verbose_name = 'Pending Review'
        verbose_name_plural = 'Pending Reviews'
        ordering = ['-submitted_at', '-created_at']

    PENDING_STATUSES = ('submitted', 'auto_validated', 'moderator_review', 'scientific_review')

    MODULE_DESTINATIONS = {
        'marine_sighting': 'Sightings',
        'ocean_sound': 'Sounds',
        'education_post': 'Education',
        'local_knowledge': 'Species Guides',
        'fish_catch': 'Fish Catch',
        'observation': 'Observations',
        'event': 'Events',
        'beach_cleanup': 'Cleanups',
    }

    @property
    def destination_module(self):
        return self.MODULE_DESTINATIONS.get(self.type, 'Public Contributions')

    @property
    def is_pending(self):
        return self.status in self.PENDING_STATUSES
