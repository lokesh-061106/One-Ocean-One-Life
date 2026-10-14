from django.db import models
from core.models import BaseModel


class EmergencyProfile(BaseModel):
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='emergency_profile')
    blood_group = models.CharField(max_length=5, blank=True)
    medical_conditions = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    boat_registration = models.CharField(max_length=100, blank=True)
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'emergency_profiles'

    def __str__(self):
        return f"Emergency Profile: {self.user.username}"
