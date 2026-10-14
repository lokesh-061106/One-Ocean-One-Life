from django.contrib import admin
from .models import AwarenessZone, OutreachCampaign, Ambassador, ConnectionRequest, Referral


@admin.register(AwarenessZone)
class AwarenessZoneAdmin(admin.ModelAdmin):
    list_display = ["location_name", "state", "band", "registered_members", "verified_contributions", "total_earnings_inr", "awareness_gap_percent"]
    list_filter = ["band", "state"]
    search_fields = ["location__name", "district"]
    ordering = ["state", "district"]

    def location_name(self, obj):
        return obj.location.name if obj.location else "-"


@admin.register(OutreachCampaign)
class OutreachCampaignAdmin(admin.ModelAdmin):
    list_display = ["campaign_id", "state", "campaign_type", "name", "priority", "is_active"]
    list_filter = ["state", "campaign_type", "priority"]
    search_fields = ["name", "message"]


@admin.register(Ambassador)
class AmbassadorAdmin(admin.ModelAdmin):
    list_display = ["volunteer_id", "name", "state", "level", "volunteer_type", "status", "onboarded_members"]
    list_filter = ["state", "level", "status"]
    search_fields = ["name", "primary_skill"]


@admin.register(ConnectionRequest)
class ConnectionRequestAdmin(admin.ModelAdmin):
    list_display = ["from_user", "to_user", "status", "distance_km", "created_at"]
    list_filter = ["status"]


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ["referral_code", "referrer", "status", "points_awarded", "created_at"]
    list_filter = ["status"]
