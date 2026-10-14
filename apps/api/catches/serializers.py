from rest_framework import serializers
from .models import FishCatch


class FishCatchListSerializer(serializers.ModelSerializer):
    contributor = serializers.CharField(source='contribution.user.username', read_only=True)
    village_name = serializers.CharField(source='contribution.village.name', read_only=True, default=None)
    status = serializers.CharField(source='contribution.status', read_only=True)
    species_display = serializers.CharField(source='display_name', read_only=True)
    notes = serializers.CharField(source='contribution.notes', read_only=True, default=None)

    class Meta:
        model = FishCatch
        fields = [
            'id', 'slug', 'species_display', 'species_level', 'species_name', 'species_group',
            'number', 'weight', 'weight_unit', 'length', 'length_unit',
            'gear', 'gear_other', 'depth_m', 'fishing_location_name',
            'photo', 'contributor', 'village_name', 'status', 'notes', 'created_at',
        ]


class FishCatchDetailSerializer(serializers.ModelSerializer):
    contributor = serializers.CharField(source='contribution.user.username', read_only=True)
    village_name = serializers.CharField(source='contribution.village.name', read_only=True, default=None)
    status = serializers.CharField(source='contribution.status', read_only=True)
    species_display = serializers.CharField(source='display_name', read_only=True)
    notes = serializers.CharField(source='contribution.notes', read_only=True, default=None)
    description = serializers.CharField(source='contribution.description', read_only=True, default=None)
    latitude = serializers.FloatField(source='contribution.location.y', read_only=True, default=None)
    longitude = serializers.FloatField(source='contribution.location.x', read_only=True, default=None)
    verified_at = serializers.DateTimeField(source='contribution.verified_at', read_only=True, default=None)

    class Meta:
        model = FishCatch
        fields = '__all__'
