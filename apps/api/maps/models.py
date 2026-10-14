from django.contrib.gis.db import models as gis_models
from django.db import models
from core.models import BaseModel


class OceanHotspot(BaseModel):
    DENSITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('very_high', 'Very High'),
    ]
    cell_id = models.CharField(max_length=50, unique=True)
    geometry = gis_models.PolygonField(srid=4326)
    center = gis_models.PointField(srid=4326)
    contribution_count = models.IntegerField(default=0)
    quality_score = models.FloatField(default=0)
    density_level = models.CharField(max_length=20, choices=DENSITY_LEVELS)  # low, medium, high, very_high
    last_calculated = models.DateTimeField()
    zone = models.ForeignKey('locations.Zone', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'ocean_hotspots'
        indexes = [
            models.Index(fields=['density_level']),
            models.Index(fields=['zone', 'density_level']),
        ]

    def __str__(self):
        return f"Hotspot {self.cell_id} — {self.density_level}"


class EmergencyContact(BaseModel):
    CONTACT_TYPES = [
        ('coast_guard', 'Coast Guard'),
        ('police', 'Police'),
        ('hospital', 'Hospital'),
        ('village', 'Village Contact'),
        ('ngo', 'NGO'),
        ('fire', 'Fire Department'),
        ('disaster', 'Disaster Management'),
    ]

    name = models.CharField(max_length=200)
    contact_type = models.CharField(max_length=50, choices=CONTACT_TYPES, db_index=True)
    phone = models.CharField(max_length=20)
    phone_secondary = models.CharField(max_length=20, blank=True)
    location = gis_models.PointField(srid=4326, null=True, blank=True)
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)
    district = models.ForeignKey('locations.District', on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    address = models.TextField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'emergency_contacts'
        ordering = ['contact_type', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_contact_type_display()})"
