from rest_framework import serializers
from .models import Zone, District, Village, StateFisheriesProfile, StateLeanPeriod


class VillageSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)
    zone_name = serializers.CharField(source='district.zone.name', read_only=True)

    class Meta:
        model = Village
        fields = ['id', 'name', 'slug', 'district', 'district_name', 'zone_name', 'population', 'is_coastal', 'latitude', 'longitude']


class DistrictSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    village_count = serializers.SerializerMethodField()

    class Meta:
        model = District
        fields = ['id', 'name', 'slug', 'zone', 'zone_name', 'state', 'population', 'area_sq_km', 'village_count']

    def get_village_count(self, obj):
        return obj.villages.count()


class ZoneSerializer(serializers.ModelSerializer):
    district_count = serializers.SerializerMethodField()
    village_count = serializers.SerializerMethodField()

    class Meta:
        model = Zone
        fields = ['id', 'name', 'slug', 'zone_number', 'description', 'district_count', 'village_count']

    def get_district_count(self, obj):
        return obj.districts.count()

    def get_village_count(self, obj):
        return Village.objects.filter(district__zone=obj).count()


class ZoneDetailSerializer(ZoneSerializer):
    districts = DistrictSerializer(many=True, read_only=True)

    class Meta(ZoneSerializer.Meta):
        fields = ZoneSerializer.Meta.fields + ['districts']


class StateLeanPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = StateLeanPeriod
        fields = ['id', 'district', 'region_label', 'typical_period', 'main_reason', 'confidence', 'order']


class StateFisheriesProfileSerializer(serializers.ModelSerializer):
    lean_periods = StateLeanPeriodSerializer(many=True, read_only=True)
    live_stats = serializers.SerializerMethodField()

    class Meta:
        model = StateFisheriesProfile
        fields = [
            'id', 'state', 'slug', 'latitude', 'longitude',
            'coastal_length_km', 'eez', 'continental_shelf_km2', 'coastal_districts',
            'marine_fishing_villages', 'fisherfolk_population', 'welfare_registered',
            'mechanized_crafts', 'motorized_crafts', 'non_motorized_crafts', 'total_crafts',
            'agencies', 'ban_relief_text', 'lean_allowance_text', 'period_remarks',
            'data_note', 'lean_periods', 'live_stats',
        ]

    def get_live_stats(self, obj):
        from django.db.models import Sum
        from accounts.models import Profile
        from contributions.models import Contribution
        from .models import District, Village

        contributions = Contribution.objects.filter(village__district__state=obj.state)
        members = Profile.objects.filter(village__district__state=obj.state)
        return {
            'members': members.count(),
            'contributions': contributions.count(),
            'verified_contributions': contributions.filter(status='verified').count(),
            'total_points': contributions.aggregate(t=Sum('points'))['t'] or 0,
            'districts_in_db': District.objects.filter(state=obj.state).count(),
            'villages_in_db': Village.objects.filter(district__state=obj.state).count(),
        }
