from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.text import slugify
from core.html_utils import sanitize_html
from core.models import BaseModel


class Event(BaseModel):
    TYPE_CHOICES = [
        ('cleanup', 'Beach Cleanup'),
        ('workshop', 'Workshop'),
        ('research', 'Research'),
        ('education', 'Education'),
        ('community_meeting', 'Community Meeting'),
        ('fishing_knowledge', 'Fishing Knowledge'),
        ('tourism', 'Tourism'),
        ('awareness', 'Awareness'),
    ]

    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=250, unique=True, blank=True, db_index=False)
    description = models.TextField()
    event_type = models.CharField(max_length=30, choices=TYPE_CHOICES, db_index=True)
    # Set by contributions.publishing._ensure_event() when a contribution of
    # type 'event' (or 'beach_cleanup') is approved; removed on withdraw.
    contribution = models.OneToOneField(
        'contributions.Contribution', on_delete=models.CASCADE,
        null=True, blank=True, related_name='event',
    )
    organizer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='organized_events')
    location = gis_models.PointField(srid=4326, null=True, blank=True)
    location_name = models.CharField(max_length=200, blank=True, default='')
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    max_participants = models.IntegerField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    photo = models.ImageField(upload_to='events/', blank=True, null=True)

    class Meta:
        db_table = 'events'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['event_type', 'is_published']),
            models.Index(fields=['start_date']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_event_type_display()})"

    def save(self, *args, **kwargs):
        if isinstance(self.description, str):
            self.description = sanitize_html(self.description)
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)

    def _generate_slug(self):
        base = slugify(self.title)[:200] or "event"
        slug = base
        suffix = 2
        while Event.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{suffix}"
            suffix += 1
        return slug


class EventParticipant(BaseModel):
    STATUS_CHOICES = [
        ('registered', 'Registered'),
        ('attended', 'Attended'),
        ('cancelled', 'Cancelled'),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='event_participations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='registered')

    class Meta:
        db_table = 'event_participants'
        unique_together = ['event', 'user']

    def __str__(self):
        return f"{self.user.username} → {self.event.title}"


class EventDiary(BaseModel):
    event = models.OneToOneField(Event, on_delete=models.CASCADE, related_name='diary')
    summary = models.TextField()
    photos_count = models.IntegerField(default=0)
    videos_count = models.IntegerField(default=0)
    participants_count = models.IntegerField(default=0)
    lessons_learned = models.TextField(blank=True)
    improvements = models.TextField(blank=True)

    class Meta:
        db_table = 'event_diaries'

    def __str__(self):
        return f"Diary: {self.event.title}"


class CommunityPost(BaseModel):
    CATEGORY_CHOICES = [
        ('story', 'Story'),
        ('blog', 'Blog'),
        ('knowledge', 'Local Knowledge'),
        ('tutorial', 'Tutorial'),
        ('experience', 'Experience'),
    ]

    author = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='community_posts')
    title = models.CharField(max_length=300)
    content = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, db_index=True)
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    reactions_count = models.IntegerField(default=0)
    image = models.ImageField(upload_to='community/', blank=True, null=True)

    class Meta:
        db_table = 'community_posts'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
