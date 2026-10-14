from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.text import slugify
from core.html_utils import sanitize_html
from core.models import BaseModel

CATEGORY_ICON_CHOICES = [
    ("🐢", "🐢 Sea turtle"),
    ("🐬", "🐬 Dolphin"),
    ("🐋", "🐋 Whale"),
    ("🐟", "🐟 Fish"),
    ("🐙", "🐙 Octopus / ray"),
    ("🦈", "🦈 Shark"),
    ("🐚", "🐚 Shells"),
    ("🐦", "🐦 Seabird"),
    ("🪸", "🪸 Coral"),
    ("🌲", "🌲 Mangrove"),
    ("🌿", "🌿 Seagrass"),
    ("🏖", "🏖 Beach habitat"),
    ("🐌", "🐌 Mollusc"),
    ("🌊", "🌊 Ocean / habitat"),
    ("🎣", "🎣 Fishing practices"),
    ("📜", "📜 Laws, rules & policies"),
    ("🔬", "🔬 Science & research"),
    ("🏛", "🏛 Institution / centre"),
    ("📚", "📚 Guide / knowledge"),
    ("🛟", "🛟 Rescue & safety"),
    ("🧭", "🧭 Policy & navigation"),
]

HTML_CONTENT_FIELDS = (
    "description",
    "habitat",
    "diet",
    "behavior",
    "identification",
    "interesting_facts",
)


class GuideCategory(BaseModel):
    name = models.CharField(max_length=100)
    name_tamil = models.CharField(max_length=200, blank=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True, choices=CATEGORY_ICON_CHOICES)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'guide_categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class GuideSpecies(BaseModel):
    category = models.ForeignKey(GuideCategory, on_delete=models.CASCADE, related_name='species')
    contribution = models.OneToOneField(
        'contributions.Contribution', on_delete=models.SET_NULL, null=True, blank=True, related_name='guide_species',
    )
    common_name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=220, unique=True, blank=True, db_index=True)
    tamil_name = models.CharField(max_length=200, blank=True)
    scientific_name = models.CharField(max_length=200)
    description = models.TextField()
    habitat = models.TextField(blank=True)
    diet = models.TextField(blank=True)
    behavior = models.TextField(blank=True)
    identification = models.TextField(blank=True)
    interesting_facts = models.TextField(blank=True)
    conservation_status = models.CharField(max_length=50, blank=True)
    typical_size = models.CharField(max_length=100, blank=True)
    distribution = gis_models.MultiPolygonField(srid=4326, null=True, blank=True)
    image = models.ImageField(upload_to='guides/', blank=True, null=True)
    is_verified = models.BooleanField(default=False, db_index=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'guide_species'
        # id tiebreaker keeps PageNumberPagination stable when many rows share a name
        ordering = ['common_name', 'id']
        indexes = [
            models.Index(fields=['category', 'is_verified']),
        ]

    def __str__(self):
        return f"{self.common_name} ({self.scientific_name})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_slug()
        for field in HTML_CONTENT_FIELDS:
            value = getattr(self, field, None)
            if isinstance(value, str):
                setattr(self, field, sanitize_html(value))
        super().save(*args, **kwargs)

    def _generate_slug(self):
        base = slugify(self.common_name)[:180] or "guide"
        slug = base
        counter = 2
        while GuideSpecies.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{counter}"
            counter += 1
        return slug
