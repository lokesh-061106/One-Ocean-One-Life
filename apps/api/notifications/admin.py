from django.contrib import admin
from django.utils.html import format_html
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["title", "user_name", "type_badge", "is_read", "created_at"]
    list_filter = ["notification_type", "is_read", "created_at"]
    search_fields = ["title", "message", "user__username"]
    raw_id_fields = ["user"]
    readonly_fields = ["created_at", "updated_at"]

    def user_name(self, obj):
        return str(obj.user) if obj.user else "-"
    user_name.short_description = "User"

    def type_badge(self, obj):
        colors = {
            "event_nearby": "#1565C0",
            "contribution_verified": "#2E7D32",
            "recognition_received": "#F59E0B",
            "emergency_alert": "#DC3545",
            "scheme_updated": "#7C3AED",
            "sighting_validated": "#00ACC1",
            "sound_sold": "#E65100",
        }
        color = colors.get(obj.notification_type, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_notification_type_display(),
        )
    type_badge.short_description = "Type"
