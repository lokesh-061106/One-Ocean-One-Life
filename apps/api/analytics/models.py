from django.db import models
from core.models import BaseModel


class AnnualReport(BaseModel):
    year = models.IntegerField(unique=True)
    total_contributions = models.IntegerField(default=0)
    verified_contributions = models.IntegerField(default=0)
    total_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    total_villages = models.IntegerField(default=0)
    total_districts = models.IntegerField(default=0)
    total_zones = models.IntegerField(default=0)
    total_events = models.IntegerField(default=0)
    total_sightings = models.IntegerField(default=0)
    total_sounds = models.IntegerField(default=0)
    research_usage_count = models.IntegerField(default=0)
    livelihood_projects = models.IntegerField(default=0)
    ecotourism_projects = models.IntegerField(default=0)
    beach_cleanups = models.IntegerField(default=0)
    total_points_awarded = models.IntegerField(default=0)
    monthly_data = models.JSONField(default=dict)
    variance_analysis = models.JSONField(default=dict)
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'annual_reports'
        ordering = ['-year']

    def __str__(self):
        return f"Annual Report {self.year}"


class MonthlyTrend(BaseModel):
    year = models.IntegerField(db_index=True)
    month = models.IntegerField(db_index=True)
    contributions_count = models.IntegerField(default=0)
    verified_count = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    sightings_count = models.IntegerField(default=0)
    sounds_count = models.IntegerField(default=0)
    events_count = models.IntegerField(default=0)
    points_awarded = models.IntegerField(default=0)
    villages_active = models.IntegerField(default=0)
    weather_factor = models.CharField(max_length=50, blank=True)
    season_factor = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'monthly_trends'
        ordering = ['-year', '-month']
        unique_together = ['year', 'month']

    def __str__(self):
        return f"Trend {self.year}-{self.month:02d}"
