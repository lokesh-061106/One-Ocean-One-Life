from django.db import models
from core.models import BaseModel


class SpeciesIdentification(BaseModel):
    confidence_levels = [
        ('high', 'High (>80%)'),
        ('medium', 'Medium (50-80%)'),
        ('low', 'Low (<50%)'),
    ]

    image = models.ImageField(upload_to='ai/species/')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='species_identifications')
    suggested_species = models.CharField(max_length=200)
    scientific_name = models.CharField(max_length=200, blank=True)
    confidence = models.FloatField()
    confidence_level = models.CharField(max_length=10, choices=confidence_levels)
    all_predictions = models.JSONField(default=list)
    is_human_verified = models.BooleanField(default=False)
    verified_species = models.ForeignKey(
        'guides.GuideSpecies', on_delete=models.SET_NULL, null=True, blank=True
    )
    processing_time_ms = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'species_identifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.suggested_species} ({self.confidence:.0%})"


class VoiceObservation(BaseModel):
    LANGUAGES = [
        ('ta', 'Tamil'),
        ('en', 'English'),
    ]

    audio_file = models.FileField(upload_to='ai/voice/')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='voice_observations')
    language = models.CharField(max_length=5, choices=LANGUAGES, default='ta')
    transcribed_text = models.TextField(blank=True)
    parsed_data = models.JSONField(default=dict)
    confidence = models.FloatField(null=True, blank=True)
    processing_time_ms = models.IntegerField(null=True, blank=True)
    engine_used = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'voice_observations'
        ordering = ['-created_at']

    def __str__(self):
        return f"Voice obs by {self.user.username} ({self.language})"


class TranslationLog(BaseModel):
    source_text = models.TextField()
    source_language = models.CharField(max_length=5)
    target_language = models.CharField(max_length=5)
    translated_text = models.TextField()
    confidence = models.FloatField(null=True, blank=True)
    engine = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'translation_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.source_language} → {self.target_language}: {self.source_text[:50]}"


class DataQualityReport(BaseModel):
    contribution = models.OneToOneField(
        'contributions.Contribution', on_delete=models.CASCADE, related_name='quality_report'
    )
    completeness_score = models.FloatField(default=0)
    accuracy_score = models.FloatField(default=0)
    consistency_score = models.FloatField(default=0)
    overall_score = models.FloatField(default=0)
    issues = models.JSONField(default=list)
    suggestions = models.JSONField(default=list)
    is_auto_validated = models.BooleanField(default=False)

    class Meta:
        db_table = 'data_quality_reports'
        ordering = ['-overall_score']

    def __str__(self):
        return f"Quality {self.contribution.id} — {self.overall_score:.0%}"
