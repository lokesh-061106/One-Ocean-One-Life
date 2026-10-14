from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Observation


@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = [
        "observation_display", "contribution_link", "category_badge",
        "organism_name", "has_photo", "created_at",
    ]
    list_filter = ["observation_category", "contribution__status", "created_at"]
    search_fields = [
        "organism_name",
        "contribution__title", "contribution__notes",
        "contribution__user__username", "contribution__user__email",
    ]
    raw_id_fields = ["contribution"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = [
        ("Observation", {"fields": ["contribution", "slug"]}),
        ("Details", {"fields": ["observation_category", "organism_name"]}),
        ("Media", {"fields": ["photo"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    @admin.display(description="Observation")
    def observation_display(self, obj):
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

    @admin.display(description="Category")
    def category_badge(self, obj):
        if not obj.observation_category:
            return "-"
        colors = {
            "animal": "#1565C0", "plant": "#2E7D32", "pollution": "#C2185B",
            "debris": "#E65100", "habitat": "#00ACC1", "other": "#6B7280",
        }
        color = colors.get(obj.observation_category, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_observation_category_display(),
        )

    @admin.display(description="Photo", boolean=True)
    def has_photo(self, obj):
        return bool(obj.photo)
