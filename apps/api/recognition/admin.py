from django.contrib import admin
from django.utils.html import format_html
from .models import RecognitionAward, ContributionScore


@admin.register(RecognitionAward)
class RecognitionAwardAdmin(admin.ModelAdmin):
    list_display = ["user_name", "category_badge", "year", "title", "score", "rank", "village_name", "zone_name"]
    list_filter = ["category", "year"]
    search_fields = ["user__username", "title", "description"]
    raw_id_fields = ["user", "village", "zone"]
    readonly_fields = ["created_at", "updated_at"]

    def user_name(self, obj):
        return str(obj.user) if obj.user else "-"
    user_name.short_description = "User"

    def village_name(self, obj):
        return str(obj.village) if obj.village else "-"
    village_name.short_description = "Village"

    def zone_name(self, obj):
        return str(obj.zone) if obj.zone else "-"
    zone_name.short_description = "Zone"

    def category_badge(self, obj):
        colors = {
            "fisherman": "#00ACC1",
            "ocean_observer": "#1565C0",
            "marine_guardian": "#2E7D32",
            "data_contributor": "#7C3AED",
            "knowledge_keeper": "#E65100",
            "community_champion": "#C2185B",
            "event_organizer": "#3949AB",
            "ocean_educator": "#8E24AA",
            "sustainable_family": "#43A047",
            "coastal_enterprise": "#F59E0B",
            "livelihood_champion": "#00897B",
            "community_partner": "#FF7043",
            "conservation_partner": "#66BB6A",
            "knowledge_partner": "#AB47BC",
            "sustainable_business": "#26A69A",
        }
        color = colors.get(obj.category, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_category_display(),
        )
    category_badge.short_description = "Category"


@admin.register(ContributionScore)
class ContributionScoreAdmin(admin.ModelAdmin):
    list_display = ["user_name", "total_score", "verified_contributions", "total_contributions", "quality_average", "last_calculated"]
    search_fields = ["user__username"]
    raw_id_fields = ["user"]
    readonly_fields = ["last_calculated"]

    def user_name(self, obj):
        return str(obj.user) if obj.user else "-"
    user_name.short_description = "User"
