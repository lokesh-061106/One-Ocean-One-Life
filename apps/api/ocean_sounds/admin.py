from django.contrib import admin
from django.utils.html import format_html
from .models import OceanSound, SoundCategory, SoundItem


@admin.register(OceanSound)
class OceanSoundAdmin(admin.ModelAdmin):
    list_display = ["instrument", "manufacturer", "model_number", "duration_display", "frequency_range", "depth_meters", "recording_date", "recording_time", "created_at"]
    list_filter = ["instrument", "recording_date", "contribution__status"]
    search_fields = ["instrument", "manufacturer", "model_number", "written_description", "measurement_method"]
    raw_id_fields = ["contribution"]
    readonly_fields = ["created_at", "updated_at"]

    def duration_display(self, obj):
        if obj.duration_seconds is None:
            return "-"
        mins = int(obj.duration_seconds // 60)
        secs = int(obj.duration_seconds % 60)
        return f"{mins}m {secs}s"
    duration_display.short_description = "Duration"


def _file_link(field_name, label="View"):
    def renderer(obj):
        field = getattr(obj, field_name, None)
        if not field:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noopener">{}</a>', field.url, label)
    return renderer


class SoundItemInline(admin.TabularInline):
    model = SoundItem
    fields = ["name", "slug", "sort_order", "audio_file", "photo_file", "spectrogram_file", "document", "open_document"]
    readonly_fields = ["open_document"]
    extra = 0
    ordering = ["sort_order", "name"]

    def open_document(self, obj):
        if not obj.pk or not obj.document:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noopener">View</a>', obj.document.url)
    open_document.short_description = "Doc link"


@admin.register(SoundCategory)
class SoundCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "parent", "item_count", "has_document", "sort_order"]
    list_filter = ["parent"]
    search_fields = ["name", "slug", "description"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at", "document_link"]
    inlines = [SoundItemInline]
    fieldsets = [
        (None, {"fields": ["name", "slug", "parent", "icon", "sort_order"]}),
        ("Description", {"fields": ["description"]}),
        ("Reference document", {"fields": ["document", "document_name", "document_link"]}),
    ]

    def item_count(self, obj):
        return obj.items.count() + sum(child.items.count() for child in obj.children.all())
    item_count.short_description = "Sounds"

    def has_document(self, obj):
        return bool(obj.document)
    has_document.boolean = True
    has_document.short_description = "Doc"

    def document_link(self, obj):
        if not obj.document:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noopener">View document</a>', obj.document.url)
    document_link.short_description = "Document"


@admin.register(SoundItem)
class SoundItemAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "source", "audio_link", "photo_link", "spectrogram_link", "document_link", "sort_order", "created_at"]
    list_filter = ["category", "source"]
    search_fields = ["name", "slug", "description", "source"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at", "document_link"]
    fieldsets = [
        (None, {"fields": ["category", "name", "slug", "sort_order", "source"]}),
        ("Description", {"fields": ["description"]}),
        ("Audio", {"fields": ["audio_file"]}),
        ("Photo", {"fields": ["photo_file"]}),
        ("Spectrogram", {"fields": ["spectrogram_file"]}),
        ("Document", {"fields": ["document", "document_name", "document_link"]}),
    ]

    def audio_link(self, obj):
        if not obj.audio_file:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noopener">Play</a>', obj.audio_file.url)
    audio_link.short_description = "Audio"

    def photo_link(self, obj):
        if not obj.photo_file:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noopener">View</a>', obj.photo_file.url)
    photo_link.short_description = "Photo"

    def spectrogram_link(self, obj):
        if not obj.spectrogram_file:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noopener">View</a>', obj.spectrogram_file.url)
    spectrogram_link.short_description = "Spec"

    def document_link(self, obj):
        if not obj.document:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noopener">View</a>', obj.document.url)
    document_link.short_description = "Doc"
