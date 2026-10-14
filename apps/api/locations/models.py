from django.contrib.gis.db import models as gis_models
from django.db import models
from core.models import BaseModel


class Zone(BaseModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    zone_number = models.IntegerField(unique=True)
    boundary = gis_models.MultiPolygonField(srid=4326)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'zones'
        ordering = ['zone_number']

    def __str__(self):
        return f"Zone {self.zone_number} — {self.name}"


class CoastalRegion(BaseModel):
    """
    Named coastal region used by the region-wise scoreboard and map, e.g.
    'Chennai Metropolitan Coast', 'Palk Bay & Gulf of Mannar', 'North Kerala Coast'.
    22 regions across Tamil Nadu, Andhra Pradesh, Kerala and Karnataka.
    """

    name = models.CharField(max_length=120, db_index=True)
    slug = models.SlugField(unique=True)
    state = models.CharField(max_length=60, db_index=True)
    latitude = models.FloatField(null=True, blank=True, help_text='Region marker for the map')
    longitude = models.FloatField(null=True, blank=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'coastal_regions'
        ordering = ['state', 'order', 'name']
        unique_together = ['name', 'state']

    def __str__(self):
        return f"{self.name} ({self.state})"


class District(BaseModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='districts')
    boundary = gis_models.MultiPolygonField(srid=4326)
    state = models.CharField(max_length=100, default='Tamil Nadu')
    population = models.IntegerField(null=True, blank=True)
    area_sq_km = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'districts'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.zone})"


class Village(BaseModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField()
    external_id = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text='External source identifier, e.g. spreadsheet Location_ID (TN001)',
    )
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='villages')
    region = models.ForeignKey(
        CoastalRegion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='villages',
        help_text='Named coastal region for region-wise scoreboards',
    )
    boundary = gis_models.MultiPolygonField(srid=4326, null=True, blank=True)
    center = gis_models.PointField(srid=4326, null=True, blank=True)
    population = models.IntegerField(null=True, blank=True)
    is_coastal = models.BooleanField(default=False, db_index=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'villages'
        ordering = ['name']
        unique_together = ['slug', 'district']

    def __str__(self):
        return f"{self.name}, {self.district.name}"


class StateFisheriesProfile(BaseModel):
    """Marine fisheries profile of a southern coastal state (reference data)."""

    state = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    latitude = models.FloatField(help_text='Map marker latitude (coastal centroid)')
    longitude = models.FloatField(help_text='Map marker longitude (coastal centroid)')

    coastal_length_km = models.CharField(max_length=50, blank=True)
    eez = models.CharField(max_length=60, blank=True, help_text='Exclusive Economic Zone')
    continental_shelf_km2 = models.CharField(max_length=50, blank=True)
    coastal_districts = models.PositiveIntegerField(default=0)
    marine_fishing_villages = models.CharField(max_length=50, blank=True)
    fisherfolk_population = models.CharField(max_length=50, blank=True)
    welfare_registered = models.CharField(max_length=100, blank=True)

    mechanized_crafts = models.PositiveIntegerField(default=0)
    motorized_crafts = models.PositiveIntegerField(default=0)
    non_motorized_crafts = models.PositiveIntegerField(default=0)
    total_crafts = models.PositiveIntegerField(default=0)

    agencies = models.JSONField(
        default=list,
        blank=True,
        help_text='Key fisheries divisions/agencies, e.g. [{"name": "TNFDC", "detail": "..."}]',
    )
    ban_relief_text = models.TextField(blank=True)
    lean_allowance_text = models.TextField(blank=True)
    period_remarks = models.TextField(blank=True)
    data_note = models.TextField(blank=True, help_text='Reference-year / source disclaimer')

    class Meta:
        db_table = 'state_fisheries_profiles'
        ordering = ['state']

    def __str__(self):
        return f"Fisheries profile — {self.state}"


class StateLeanPeriod(BaseModel):
    profile = models.ForeignKey(
        StateFisheriesProfile,
        on_delete=models.CASCADE,
        related_name='lean_periods',
    )
    district = models.CharField(
        max_length=100,
        blank=True,
        help_text='District name; blank = state-wide row',
    )
    region_label = models.CharField(max_length=150, help_text='Coastal district / region as stated')
    typical_period = models.CharField(max_length=150)
    start_month = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text='Month (1-12) the lean window begins; enables date computation',
    )
    start_day = models.PositiveSmallIntegerField(default=1, help_text='Day of start_month (1-31)')
    end_month = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text='Month (1-12) the lean window ends (may wrap the year)',
    )
    end_day = models.PositiveSmallIntegerField(null=True, blank=True, help_text='Day of end_month; blank = last day')
    main_reason = models.TextField(blank=True)
    confidence = models.TextField(blank=True, help_text='Confidence for app use')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'state_lean_periods'
        ordering = ['profile__state', 'order']

    def __str__(self):
        region = self.district or self.region_label
        return f"{self.profile.state}: {region} — {self.typical_period}"
