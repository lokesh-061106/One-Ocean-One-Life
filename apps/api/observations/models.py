from django.db import models
from django.utils.text import slugify
from core.models import BaseModel
from contributions.schemas import OBSERVATION_CATEGORY_CHOICES


class Observation(BaseModel):
    """Mirror of an approved ``Contribution(type='observation')``.

    Created only by ``contributions.publishing._ensure_observation`` when a
    contribution is approved, and removed when it is withdrawn/rejected — so a
    row existing here implies the source contribution is verified.
    """

    contribution = models.OneToOneField(
        'contributions.Contribution',
        on_delete=models.CASCADE,
        related_name='observation',
    )
    slug = models.SlugField(max_length=240, unique=True, blank=True)

    observation_category = models.CharField(max_length=30, choices=OBSERVATION_CATEGORY_CHOICES, blank=True)
    organism_name = models.CharField(max_length=200, blank=True)

    photo = models.ImageField(upload_to='observations/', blank=True, null=True)

    class Meta:
        db_table = 'observations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['observation_category']),
        ]

    def __str__(self):
        return self._source_name()

    @property
    def display_name(self):
        return self._source_name()

    def _source_name(self):
        if self.organism_name:
            return self.organism_name
        title = self.contribution.title if self.contribution_id and self.contribution else ''
        return (title or '').strip() or 'Observation'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)

    def _generate_slug(self):
        base = slugify(self._source_name())[:190] or 'observation'
        slug = base
        counter = 2
        while Observation.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{counter}"
            counter += 1
        return slug
