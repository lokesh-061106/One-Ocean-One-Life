from django.contrib import admin
from .models import EmergencyProfile


@admin.register(EmergencyProfile)
class EmergencyProfileAdmin(admin.ModelAdmin):
    list_display = ["user_name", "blood_group", "emergency_contact_name", "emergency_contact_phone", "boat_registration", "village_name", "has_medical_conditions"]
    search_fields = ["user__username", "emergency_contact_name", "emergency_contact_phone", "boat_registration"]
    raw_id_fields = ["user", "village"]
    readonly_fields = ["created_at", "updated_at"]

    def user_name(self, obj):
        return str(obj.user) if obj.user else "-"
    user_name.short_description = "User"

    def village_name(self, obj):
        return str(obj.village) if obj.village else "-"
    village_name.short_description = "Village"

    def has_medical_conditions(self, obj):
        return bool(obj.medical_conditions)
    has_medical_conditions.boolean = True
    has_medical_conditions.short_description = "Medical Info"
