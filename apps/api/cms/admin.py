from django.contrib import admin
from django.shortcuts import redirect
from .models import Page, PageSection, PageFAQ, ContactInfo, SiteHeaderConfig


class PageSectionInline(admin.StackedInline):
    model = PageSection
    extra = 0
    fields = ["title", "icon", "content", "sort_order", "is_published"]


class PageFAQInline(admin.TabularInline):
    model = PageFAQ
    extra = 0
    fields = ["question", "answer", "sort_order", "is_published"]


class ContactInfoInline(admin.StackedInline):
    model = ContactInfo
    can_delete = False
    verbose_name_plural = "Contact Information"
    fields = ["email_main", "email_support", "phone_main", "phone_secondary", "address", "working_hours", "map_lat", "map_lng"]


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "is_published", "section_count", "faq_count", "has_contact_info", "sort_order", "updated_at"]
    list_filter = ["is_published"]
    search_fields = ["title", "slug", "content", "meta_description"]
    prepopulated_fields = {}
    readonly_fields = ["created_at", "updated_at"]
    inlines = [PageSectionInline, PageFAQInline, ContactInfoInline]
    fieldsets = [
        ("Basic Info", {"fields": ["slug", "title", "meta_description", "is_published", "sort_order"]}),
        ("Hero Section", {"fields": ["hero_title", "hero_subtitle", "hero_image"], "classes": ["collapse"]}),
        ("Main Content", {"fields": ["content"]}),
        ("Sidebar", {"fields": ["sidebar_content"], "classes": ["collapse"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    def section_count(self, obj):
        return obj.sections.count()
    section_count.short_description = "Sections"

    def faq_count(self, obj):
        return obj.faqs.count()
    faq_count.short_description = "FAQs"

    def has_contact_info(self, obj):
        return hasattr(obj, "contact_info")
    has_contact_info.boolean = True
    has_contact_info.short_description = "Contact"


@admin.register(PageSection)
class PageSectionAdmin(admin.ModelAdmin):
    list_display = ["title", "page", "icon", "sort_order", "is_published"]
    list_filter = ["page", "is_published"]
    search_fields = ["title", "content"]
    raw_id_fields = ["page"]


@admin.register(PageFAQ)
class PageFAQAdmin(admin.ModelAdmin):
    list_display = ["question_short", "page", "sort_order", "is_published"]
    list_filter = ["page", "is_published"]
    search_fields = ["question", "answer"]
    raw_id_fields = ["page"]

    def question_short(self, obj):
        return obj.question[:80] + "..." if len(obj.question) > 80 else obj.question
    question_short.short_description = "Question"


@admin.register(SiteHeaderConfig)
class SiteHeaderConfigAdmin(admin.ModelAdmin):
    """Singleton storefront header-menu config (same row the /api/v1/cms/header-menu/ endpoint edits)."""

    list_display = ["selected_menu_option", "show_option1", "show_option2", "show_option3", "show_option4", "show_option5", "updated_at"]
    readonly_fields = ["updated_at"]

    def has_add_permission(self, request):
        return not SiteHeaderConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        return redirect("admin:cms_siteheaderconfig_change", SiteHeaderConfig.get_singleton().pk)
