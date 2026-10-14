from django.db import models
from core.models import BaseModel


class AuditLog(BaseModel):
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('read', 'Read'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('export', 'Export'),
        ('review', 'Review'),
        ('verify', 'Verify'),
        ('reject', 'Reject'),
        ('payment', 'Payment'),
    ]

    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, db_index=True)
    resource_type = models.CharField(max_length=100, db_index=True)
    resource_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict)
    changes = models.JSONField(default=dict)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'action']),
            models.Index(fields=['resource_type', 'action']),
        ]

    def __str__(self):
        user_str = self.user.username if self.user else 'system'
        return f"{user_str} — {self.action} — {self.resource_type}"


class UserConsent(BaseModel):
    CONSENT_TYPES = [
        ('location_sharing', 'Location Sharing'),
        ('data_collection', 'Data Collection'),
        ('research_usage', 'Research Usage'),
        ('marketing', 'Marketing Communications'),
        ('third_party_sharing', 'Third Party Data Sharing'),
    ]

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='consents')
    consent_type = models.CharField(max_length=30, choices=CONSENT_TYPES, db_index=True)
    granted = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'user_consents'
        unique_together = ['user', 'consent_type']

    def __str__(self):
        return f"{self.user.username} — {self.consent_type} — {'granted' if self.granted else 'denied'}"


class DataExportRequest(BaseModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='data_export_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_url = models.URLField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'data_export_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Export {self.user.username} — {self.status}"
