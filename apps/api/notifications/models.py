from django.db import models
from core.models import BaseModel


class Notification(BaseModel):
    NOTIFICATION_TYPES = [
        ('event_nearby', 'Event Nearby'),
        ('contribution_verified', 'Contribution Verified'),
        ('recognition_received', 'Recognition Received'),
        ('emergency_alert', 'Emergency Alert'),
        ('scheme_updated', 'Scheme Updated'),
        ('sighting_validated', 'Sighting Validated'),
        ('sound_sold', 'Sound Sold'),
    ]

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    data = models.JSONField(default=dict)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"{self.title} → {self.user.username}"
