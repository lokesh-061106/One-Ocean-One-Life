from rest_framework import serializers
from .models import EmergencyProfile
from maps.models import EmergencyContact


class EmergencyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyProfile
        fields = '__all__'
        read_only_fields = ['user']


class EmergencyContactSerializer(serializers.ModelSerializer):
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = EmergencyContact
        fields = [
            'id', 'name', 'contact_type', 'phone', 'phone_secondary',
            'latitude', 'longitude', 'address', 'village', 'district',
            'is_active', 'distance_km',
        ]

    def get_distance_km(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(obj, 'distance'):
            return None
        return round(obj.distance.km, 1)
