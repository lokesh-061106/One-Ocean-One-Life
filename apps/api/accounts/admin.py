from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import User, Profile


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = "Profile"
    fields = ["village", "occupation", "organization", "bio", "photo", "location_precision", "member_status", "contribution_score", "total_contributions", "total_verified", "total_events", "latitude", "longitude", "last_active_at"]
    raw_id_fields = ["village"]
    readonly_fields = ["contribution_score", "total_contributions", "total_verified", "total_events", "last_active_at"]


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["username", "email", "full_name", "role_badge", "phone", "is_verified", "is_active", "date_joined"]
    list_filter = ["role", "is_verified", "is_active", "preferred_language", "date_joined"]
    search_fields = ["username", "email", "first_name", "last_name", "phone"]
    readonly_fields = ["date_joined", "last_login"]
    inlines = [ProfileInline]

    fieldsets = UserAdmin.fieldsets + (
        ("O3L", {"fields": ("phone", "role", "is_verified", "preferred_language")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("O3L", {"fields": ("phone", "role")}),
    )

    def full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or "-"
    full_name.short_description = "Name"

    def role_badge(self, obj):
        colors = {
            "SUPER_ADMIN": "#DC3545",
            "ADMIN": "#E65100",
            "MODERATOR": "#7C3AED",
            "SCIENTIFIC_VALIDATOR": "#00897B",
            "RESEARCHER": "#1565C0",
            "NGO": "#2E7D32",
            "COMMUNITY_ORGANIZATION": "#C2185B",
            "FISHERMAN": "#00ACC1",
            "COMMUNITY_MEMBER": "#6B7280",
            "VENDOR": "#F59E0B",
            "TOURISM_PROVIDER": "#3949AB",
            "EDUCATOR": "#8E24AA",
            "VOLUNTEER": "#43A047",
            "GUEST": "#9E9E9E",
        }
        color = colors.get(obj.role, "#6B7280")
        return format_html('<span style="background:{};color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">{}</span>', color, obj.get_role_display())
    role_badge.short_description = "Role"


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["user_display", "village", "occupation", "organization", "member_status", "contribution_score", "total_contributions", "total_verified", "last_active_at"]
    list_filter = ["member_status", "location_precision", "occupation"]
    search_fields = ["user__username", "user__email", "occupation", "organization", "bio"]
    raw_id_fields = ["user", "village"]
    readonly_fields = ["contribution_score", "total_contributions", "total_verified", "total_events", "last_active_at"]

    def user_display(self, obj):
        return str(obj.user)
    user_display.short_description = "User"
