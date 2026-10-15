from rest_framework import serializers
from .models import Page, PageSection, PageFAQ, ContactInfo, SiteHeaderConfig, MenuItem


class PageSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageSection
        fields = ["id", "title", "icon", "content", "sort_order"]


class PageFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageFAQ
        fields = ["id", "question", "answer", "sort_order"]


class ContactInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInfo
        fields = ["email_main", "email_support", "phone_main", "phone_secondary", "address", "working_hours", "map_lat", "map_lng"]


class PageListSerializer(serializers.ModelSerializer):
    section_count = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = ["id", "slug", "title", "meta_description", "hero_title", "hero_subtitle", "is_published", "section_count", "sort_order", "updated_at"]

    def get_section_count(self, obj):
        return obj.sections.count()


class PageDetailSerializer(serializers.ModelSerializer):
    sections = PageSectionSerializer(many=True, read_only=True)
    faqs = PageFAQSerializer(many=True, read_only=True)
    contact_info = ContactInfoSerializer(read_only=True)
    hero_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = [
            "id", "slug", "title", "meta_description",
            "hero_title", "hero_subtitle", "hero_image_url",
            "content", "sidebar_content",
            "sections", "faqs", "contact_info",
            "is_published", "sort_order", "updated_at",
        ]

    def get_hero_image_url(self, obj):
        if obj.hero_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.hero_image.url)
            return obj.hero_image.url
        return None


class HeaderMenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteHeaderConfig
        fields = ["selected_menu_option", "show_option1", "show_option2", "show_option3", "show_option4", "show_option5", "updated_at"]
        read_only_fields = ["updated_at"]


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ["id", "key", "label", "href", "group", "description", "icon", "sort_order", "is_visible", "is_accent", "updated_at"]
        read_only_fields = ["updated_at"]


class MenuItemBulkSerializer(serializers.Serializer):
    """Partial update payload for the admin save action."""

    id = serializers.IntegerField()
    is_visible = serializers.BooleanField(required=False)
    sort_order = serializers.IntegerField(required=False)
