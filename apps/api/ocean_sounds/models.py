import os

from django.core.validators import FileExtensionValidator
from django.db import models
from core.models import BaseModel


class OceanSound(BaseModel):
    contribution = models.OneToOneField('contributions.Contribution', on_delete=models.CASCADE, related_name='ocean_sound')
    audio_file = models.FileField(upload_to='sounds/')
    duration_seconds = models.FloatField(null=True, blank=True)
    instrument = models.CharField(max_length=100, blank=True)
    manufacturer = models.CharField(max_length=100, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    depth_meters = models.FloatField(null=True, blank=True)
    measurement_method = models.TextField(blank=True)
    voice_description = models.FileField(upload_to='sounds/voice/', blank=True, null=True)
    written_description = models.TextField(blank=True)
    environmental_conditions = models.JSONField(default=dict)
    frequency_range = models.CharField(max_length=100, blank=True)
    recording_date = models.DateField(null=True, blank=True)
    recording_time = models.TimeField(null=True, blank=True)

    class Meta:
        db_table = 'ocean_sounds'
        ordering = ['-created_at']

    def __str__(self):
        return f"Sound by {self.contribution.user.username} — {self.created_at}"


class SoundCategory(BaseModel):
    """Hierarchical category for the curated Ocean Sound Library.

    Level 1 — the three top categories, e.g. "Marine Species Audio Image Spectrogram".
    Level 2 — optional sub-groups, e.g. "Mysticetes (Baleen Whales)".
    A leaf category carries an optional reference document (PDF/Word) that opens
    in the website popup viewer.
    """

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    document = models.FileField(
        upload_to='sounds/library/docs/',
        blank=True,
        null=True,
        help_text="Reference document for this category/group (PDF, Word, Excel). Opens in a popup on the website.",
    )
    document_name = models.CharField(
        max_length=200, blank=True,
        help_text="Display name for the reference document. Leave blank to use the file name.",
    )
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'sound_categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name

    @property
    def display_document_name(self):
        if self.document_name:
            return self.document_name
        return os.path.basename(self.document.name) if self.document else ''

    @property
    def document_type(self):
        name = self.document.name if self.document else ''
        return os.path.splitext(name)[1].lower().lstrip('.') or 'file'

    @property
    def document_size(self):
        try:
            return self.document.size
        except (OSError, ValueError):
            return 0


class SoundItem(BaseModel):
    """A single curated ocean sound: audio + photo + spectrogram + optional document."""

    ALLOWED_DOCUMENT_EXTENSIONS = (
        'pdf', 'doc', 'docx', 'docm', 'dot', 'dotx', 'dotm',
        'xls', 'xlsx', 'xlsm', 'xlsb', 'csv',
        'ppt', 'pptx', 'pps', 'ppsx',
        'txt', 'rtf', 'odt', 'ods', 'odp',
    )

    category = models.ForeignKey(SoundCategory, on_delete=models.CASCADE, related_name='items')
    contribution = models.OneToOneField(
        'contributions.Contribution', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sound_item',
        help_text='Contribution that published this item (set when created via the wizard).',
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    source = models.CharField(max_length=100, blank=True, default='NOAA 2023')
    audio_file = models.FileField(upload_to='sounds/library/audio/', blank=True, null=True)
    photo_file = models.FileField(upload_to='sounds/library/photos/', blank=True, null=True)
    spectrogram_file = models.FileField(upload_to='sounds/library/spectrograms/', blank=True, null=True)
    document = models.FileField(
        upload_to='sounds/library/docs/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=list(ALLOWED_DOCUMENT_EXTENSIONS))],
        help_text="Document for this sound (PDF, Word, Excel). Opens in a popup on the website.",
    )
    document_name = models.CharField(
        max_length=200, blank=True,
        help_text="Display name for the document. Leave blank to use the file name.",
    )
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'sound_items'
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['category', 'sort_order']),
        ]

    def __str__(self):
        return self.name

    @property
    def display_document_name(self):
        if self.document_name:
            return self.document_name
        return os.path.basename(self.document.name) if self.document else ''

    @property
    def document_type(self):
        name = self.document.name if self.document else ''
        return os.path.splitext(name)[1].lower().lstrip('.') or 'file'

    @property
    def document_size(self):
        try:
            return self.document.size
        except (OSError, ValueError):
            return 0
