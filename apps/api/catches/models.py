from django.db import models
from django.utils.text import slugify
from core.models import BaseModel
from contributions.schemas import (
    GEAR_CHOICES,
    SPECIES_GROUP_CHOICES,
    SPECIES_LEVEL_CHOICES,
)


class FishCatch(BaseModel):
    """Mirror of an approved ``Contribution(type='fish_catch')``.

    Created only by ``contributions.publishing._ensure_fish_catch`` when a
    contribution is approved, and removed when it is withdrawn/rejected — so a
    row existing here implies the source contribution is verified.
    """

    contribution = models.OneToOneField(
        'contributions.Contribution',
        on_delete=models.CASCADE,
        related_name='fish_catch',
    )
    slug = models.SlugField(max_length=240, unique=True, blank=True)

    species_level = models.CharField(max_length=20, choices=SPECIES_LEVEL_CHOICES, blank=True)
    species_name = models.CharField(max_length=200, blank=True)
    species_guide_id = models.CharField(max_length=64, blank=True)
    species_group = models.CharField(max_length=30, choices=SPECIES_GROUP_CHOICES, blank=True)

    number = models.IntegerField(default=1)
    weight = models.FloatField(null=True, blank=True)
    weight_unit = models.CharField(max_length=10, choices=[('kg', 'kg'), ('g', 'g')], default='kg')
    length = models.FloatField(null=True, blank=True)
    length_unit = models.CharField(max_length=10, choices=[('cm', 'cm'), ('m', 'm')], default='cm')
    gear = models.CharField(max_length=30, choices=GEAR_CHOICES, blank=True)
    gear_other = models.CharField(max_length=200, blank=True)
    depth_m = models.FloatField(null=True, blank=True)
    fishing_location_name = models.CharField(max_length=200, blank=True)

    photo = models.ImageField(upload_to='catches/', blank=True, null=True)

    class Meta:
        db_table = 'fish_catches'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['gear']),
            models.Index(fields=['species_group']),
        ]

    def __str__(self):
        return self._source_name()

    @property
    def display_name(self):
        return self._source_name()

    def _source_name(self):
        if self.species_name:
            return self.species_name
        title = self.contribution.title if self.contribution_id and self.contribution else ''
        return (title or '').strip() or 'Fish catch'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)

    def _generate_slug(self):
        base = slugify(self._source_name())[:190] or 'fish-catch'
        slug = base
        counter = 2
        while FishCatch.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{counter}"
            counter += 1
        return slug
