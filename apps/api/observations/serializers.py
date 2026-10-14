from rest_framework import serializers
from .models import Observation


class ObservationListSerializer(serializers.ModelSerializer):
    contributor = serializers.CharField(source='contribution.user.username', read_only=True)
    village_name = serializers.CharField(source='contribution.village.name', read_only=True, default=None)
    status = serializers.CharField(source='contribution.status', read_only=True)
    observation_display = serializers.CharField(source='display_name', read_only=True)
    category_display = serializers.CharField(source='get_observation_category_display', read_only=True)
    notes = serializers.CharField(source='contribution.notes', read_only=True, default=None)

    class Meta:
        model = Observation
        fields = [
            'id', 'slug', 'observation_display', 'observation_category', 'category_display',
            'organism_name', 'photo', 'contributor', 'village_name', 'status', 'notes',
            'created_at',
        ]


class ObservationDetailSerializer(serializers.ModelSerializer):
    contributor = serializers.CharField(source='contribution.user.username', read_only=True)
    village_name = serializers.CharField(source='contribution.village.name', read_only=True, default=None)
    status = serializers.CharField(source='contribution.status', read_only=True)
    observation_display = serializers.CharField(source='display_name', read_only=True)
    category_display = serializers.CharField(source='get_observation_category_display', read_only=True)
    notes = serializers.CharField(source='contribution.notes', read_only=True, default=None)
    description = serializers.CharField(source='contribution.description', read_only=True, default=None)
    latitude = serializers.FloatField(source='contribution.location.y', read_only=True, default=None)
    longitude = serializers.FloatField(source='contribution.location.x', read_only=True, default=None)
    verified_at = serializers.DateTimeField(source='contribution.verified_at', read_only=True, default=None)

    class Meta:
        model = Observation
        fields = '__all__'
