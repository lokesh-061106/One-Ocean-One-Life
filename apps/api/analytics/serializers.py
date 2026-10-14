from rest_framework import serializers
from .models import AnnualReport, MonthlyTrend


class AnnualReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnualReport
        fields = [
            'id', 'year', 'total_contributions', 'verified_contributions',
            'total_users', 'active_users', 'total_villages', 'total_districts',
            'total_zones', 'total_events', 'total_sightings', 'total_sounds',
            'research_usage_count', 'livelihood_projects', 'ecotourism_projects',
            'beach_cleanups', 'total_points_awarded', 'monthly_data',
            'variance_analysis', 'generated_at',
        ]


class AnnualReportSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnualReport
        fields = [
            'id', 'year', 'total_contributions', 'verified_contributions',
            'total_users', 'active_users', 'total_villages',
            'total_events', 'total_sightings', 'total_sounds',
            'generated_at',
        ]


class MonthlyTrendSerializer(serializers.ModelSerializer):
    month_name = serializers.SerializerMethodField()

    class Meta:
        model = MonthlyTrend
        fields = [
            'id', 'year', 'month', 'month_name',
            'contributions_count', 'verified_count', 'new_users',
            'active_users', 'sightings_count', 'sounds_count',
            'events_count', 'points_awarded', 'villages_active',
            'weather_factor', 'season_factor', 'notes',
        ]

    def get_month_name(self, obj):
        import calendar
        return calendar.month_name[obj.month]


class YearComparisonSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    total_contributions = serializers.IntegerField()
    verified_contributions = serializers.IntegerField()
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    total_sightings = serializers.IntegerField()
    total_sounds = serializers.IntegerField()
    total_events = serializers.IntegerField()
    change_percent_contributions = serializers.FloatField()
    change_percent_users = serializers.FloatField()
