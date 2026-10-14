import os

from django.contrib import admin
from django.db import models
from django.urls import reverse
from django.utils.html import format_html
from core.widgets import RichTextWidget
from .models import MarineSighting, SightingCategory, SightingCategorySpecies, SightingImage, SightingDocument


class SightingImageInline(admin.TabularInline):
    model = SightingImage
    extra = 1
    fields = ["image", "caption", "sort_order", "image_preview"]
    readonly_fields = ["image_preview"]
    ordering = ["sort_order"]

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if not obj.image:
            return "-"
        return format_html('<img src="{}" style="max-height:70px;border-radius:6px;" />', obj.image.url)


class CategorySpeciesInline(admin.TabularInline):
    model = SightingCategorySpecies
    extra = 1
    fields = ["common_name", "scientific_name", "source_ref", "sort_order"]
    ordering = ["sort_order", "common_name"]


class SightingDocumentInline(admin.TabularInline):
    model = SightingDocument
    extra = 1
    fields = ["document", "name", "sort_order", "file_info", "open_link"]
    readonly_fields = ["file_info", "open_link"]
    ordering = ["sort_order"]
    max_num = 20

    @admin.display(description="File")
    def file_info(self, obj):
        if not obj.pk or not obj.document:
            return "-"
        return format_html(
            '<span style="font-size:11px;color:#666;">{} · {} · {} KB</span>',
            obj.file_type.upper(),
            os.path.basename(obj.document.name),
            f"{obj.file_size / 1024:.1f}",
        )

    @admin.display(description="Open")
    def open_link(self, obj):
        if not obj.pk or not obj.document:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noopener">View</a>', obj.document.url)


@admin.register(SightingCategory)
class SightingCategoryAdmin(admin.ModelAdmin):
    list_display = ["icon_preview", "name", "slug", "sort_order", "species_count", "sightings_count"]
    list_display_links = ["icon_preview", "name"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "description"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [CategorySpeciesInline]
    fieldsets = [
        ("Category", {"fields": ["name", "slug", "icon"]}),
        ("Details", {"fields": ["description", "sort_order"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    @admin.display(description="Icon")
    def icon_preview(self, obj):
        if not obj.icon:
            return "-"
        return format_html('<span class="o3l-icon-preview">{}</span>', obj.icon)

    @admin.display(description="Species")
    def species_count(self, obj):
        return obj.species.count()

    @admin.display(description="Sightings")
    def sightings_count(self, obj):
        return obj.sightings.count()


@admin.register(MarineSighting)
class MarineSightingAdmin(admin.ModelAdmin):
    list_display = ["species_name", "contribution_link", "category", "ai_species_suggestion", "ai_confidence", "number_observed", "behavior_badge", "sighting_date", "sighting_time", "has_photo", "image_count", "document_count", "created_at"]
    list_filter = ["category", "behavior", "contribution__status", "sighting_date"]
    search_fields = ["species__common_name", "ai_species_suggestion", "category__name", "notes", "sea_condition", "weather", "contribution__title", "contribution__user__username", "contribution__user__email"]
    raw_id_fields = ["contribution", "species", "category"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [SightingImageInline, SightingDocumentInline]
    formfield_overrides = {
        models.TextField: {"widget": RichTextWidget},
    }
    fieldsets = [
        ("Sighting", {"fields": ["contribution", "category", "species", "ai_species_suggestion", "ai_confidence"]}),
        ("Observation", {
            "description": "Notes is a rich text editor — paste long text and insert images directly (toolbar ▣ or paste).",
            "fields": ["number_observed", "behavior", "sea_condition", "weather", "notes"],
        }),
        ("Media", {
            "description": (
                "Photo/video here. Gallery images and Document files (PDF, Word, Excel, PowerPoint, "
                "txt, csv — multiple allowed) are managed in the inlined tables at the bottom of this page. "
                "Documents are listed on the website and open in a popup viewer."
            ),
            "fields": ["photo", "video"],
        }),
        ("When", {"fields": ["sighting_date", "sighting_time"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    def species_name(self, obj):
        if obj.species:
            return str(obj.species)
        return obj.ai_species_suggestion or "-"
    species_name.short_description = "Species"

    def contribution_link(self, obj):
        c = obj.contribution
        if not c:
            return "-"
        label = c.title or c.notes[:40] or str(c.id)[:8]
        status_colors = {
            "verified": "#2E7D32", "submitted": "#2196F3", "rejected": "#DC3545",
            "moderator_review": "#FF9800", "scientific_review": "#9C27B0",
            "auto_validated": "#4CAF50", "draft": "#9E9E9E", "duplicate": "#795548",
        }
        color = status_colors.get(c.status, "#6B7280")
        return format_html(
            '<a href="{}" title="{} — {}">{}</a> '
            '<span style="background:{};color:white;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:600">{}</span>',
            reverse("admin:contributions_contribution_change", args=[c.pk]),
            c.title or "(no title)", c.get_status_display(),
            label,
            color, c.get_status_display(),
        )
    contribution_link.short_description = "Contribution"
    contribution_link.admin_order_field = "contribution__created_at"

    def behavior_badge(self, obj):
        colors = {
            "traveling": "#1565C0",
            "feeding": "#2E7D32",
            "resting": "#6B7280",
            "playing": "#C2185B",
            "breeding": "#E65100",
            "unknown": "#9E9E9E",
        }
        color = colors.get(obj.behavior, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_behavior_display(),
        )
    behavior_badge.short_description = "Behavior"

    def has_photo(self, obj):
        return bool(obj.photo)
    has_photo.boolean = True
    has_photo.short_description = "Photo"

    def image_count(self, obj):
        return obj.images.count()
    image_count.short_description = "Gallery"

    def document_count(self, obj):
        return obj.documents.count()
    document_count.short_description = "Docs"
