from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import FishCatch


@admin.register(FishCatch)
class FishCatchAdmin(admin.ModelAdmin):
    list_display = [
        "species_display", "contribution_link", "gear_badge", "number",
        "weight_display", "length_display", "fishing_location_name",
        "has_photo", "created_at",
    ]
    list_filter = ["gear", "species_group", "species_level", "contribution__status", "created_at"]
    search_fields = [
        "species_name", "gear_other", "fishing_location_name",
        "contribution__title", "contribution__notes",
        "contribution__user__username", "contribution__user__email",
    ]
    raw_id_fields = ["contribution"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = [
        ("Catch", {"fields": ["contribution", "slug"]}),
        ("Species", {"fields": ["species_level", "species_name", "species_group", "species_guide_id"]}),
        ("Details", {
            "fields": ["number", "weight", "weight_unit", "length", "length_unit",
                       "gear", "gear_other", "depth_m", "fishing_location_name"],
        }),
        ("Media", {"fields": ["photo"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    @admin.display(description="Species")
    def species_display(self, obj):
        return obj.display_name

    @admin.display(description="Contribution")
    def contribution_link(self, obj):
        c = obj.contribution
        if not c:
            return "-"
        label = c.title or (c.notes[:40] if c.notes else "") or str(c.pk)[:8]
        colors = {
            "verified": "#2E7D32", "submitted": "#2196F3", "rejected": "#DC3545",
            "moderator_review": "#FF9800", "scientific_review": "#9C27B0",
            "auto_validated": "#4CAF50", "draft": "#9E9E9E", "duplicate": "#795548",
        }
        color = colors.get(c.status, "#6B7280")
        return format_html(
            '<a href="{}" title="{} — {}">{}</a> '
            '<span style="background:{};color:white;padding:1px 6px;border-radius:8px;'
            'font-size:10px;font-weight:600">{}</span>',
            reverse("admin:contributions_contribution_change", args=[c.pk]),
            c.title or "(no title)", c.get_status_display(),
            label, color, c.get_status_display(),
        )

    @admin.display(description="Gear")
    def gear_badge(self, obj):
        if not obj.gear:
            return "-"
        return format_html(
            '<span style="background:#E65100;color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            obj.get_gear_display(),
        )

    @admin.display(description="Weight")
    def weight_display(self, obj):
        return f"{obj.weight} {obj.weight_unit}" if obj.weight is not None else "-"

    @admin.display(description="Length")
    def length_display(self, obj):
        return f"{obj.length} {obj.length_unit}" if obj.length is not None else "-"

    @admin.display(description="Photo", boolean=True)
    def has_photo(self, obj):
        return bool(obj.photo)
