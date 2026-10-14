from django.contrib import admin
from django.db import models
from django.utils.html import format_html
from core.widgets import RichTextWidget
from .models import EducationCategory, EducationPost, EducationPostImage


class PostInline(admin.TabularInline):
    model = EducationPost
    extra = 0
    fields = ["title", "post_type", "is_verified", "reactions_count", "views_count"]
    readonly_fields = ["reactions_count", "views_count"]


class PostImageInline(admin.TabularInline):
    model = EducationPostImage
    extra = 1
    fields = ["image", "caption", "sort_order", "image_preview"]
    readonly_fields = ["image_preview"]
    ordering = ["sort_order"]

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if not obj.image:
            return "-"
        return format_html('<img src="{}" style="max-height:70px;border-radius:6px;" />', obj.image.url)


@admin.register(EducationCategory)
class EducationCategoryAdmin(admin.ModelAdmin):
    list_display = ["icon", "name", "name_tamil", "slug", "post_count"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "name_tamil", "description"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [PostInline]

    def post_count(self, obj):
        return obj.posts.count()
    post_count.short_description = "Posts"


@admin.register(EducationPost)
class EducationPostAdmin(admin.ModelAdmin):
    list_display = ["title", "author_name", "post_type", "category", "village_name", "is_verified", "reactions_count", "views_count", "created_at"]
    list_filter = ["post_type", "is_verified", "category", "created_at"]
    search_fields = ["title", "content", "author__username"]
    raw_id_fields = ["author", "village", "category"]
    readonly_fields = ["image_preview", "reactions_count", "views_count", "created_at", "updated_at"]
    inlines = [PostImageInline]
    formfield_overrides = {
        models.TextField: {"widget": RichTextWidget},
    }
    fieldsets = [
        ("Post", {"fields": ["author", "category", "title", "slug", "post_type", "village", "is_verified"]}),
        ("Content", {
            "description": "Write the post body here. The editor produces HTML, which is rendered as formatted content on the website. Use the image button to embed images (paste the /media/... URL).",
            "fields": ["content"],
        }),
        ("Cover Image", {"fields": ["image", "image_preview"]}),
        ("Stats", {"fields": ["reactions_count", "views_count"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if not obj.image:
            return "-"
        return format_html('<img src="{}" style="max-height:200px;border-radius:8px;border:1px solid #dbe4ee;" />', obj.image.url)

    @admin.display(description="Author")
    def author_name(self, obj):
        return str(obj.author) if obj.author else "-"

    @admin.display(description="Village")
    def village_name(self, obj):
        return str(obj.village) if obj.village else "-"
