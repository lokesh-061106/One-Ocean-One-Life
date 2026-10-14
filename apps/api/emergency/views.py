from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import EmergencyProfile
from .serializers import EmergencyProfileSerializer
from maps.models import EmergencyContact


class EmergencyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = EmergencyProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = EmergencyProfile.objects.get_or_create(user=self.request.user)
        return profile


class EmergencyOfflineDataView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        contacts = list(EmergencyContact.objects.filter(is_active=True).values(
            'id', 'name', 'contact_type', 'phone', 'phone_secondary',
            'latitude', 'longitude', 'address', 'village__name', 'district__name',
        ))

        villages = []
        from locations.models import Village
        for v in Village.objects.filter(is_coastal=True).select_related('district').values(
            'id', 'name', 'latitude', 'longitude', 'district__name',
        ):
            villages.append(v)

        return Response({
            'contacts': contacts,
            'villages': villages,
            'safety_instructions': [
                {'id': 1, 'title': 'Stay Calm', 'description': 'Stay calm and assess the situation before taking action.', 'icon': 'calm'},
                {'id': 2, 'title': 'Call Coast Guard', 'description': 'Call Coast Guard immediately if at sea. Dial 1554.', 'icon': 'coast_guard'},
                {'id': 3, 'title': 'Signal for Help', 'description': 'Use whistle, mirror, or phone flashlight to signal for help.', 'icon': 'signal'},
                {'id': 4, 'title': 'Stay With Boat', 'description': 'Stay with your boat if possible. It is easier to spot.', 'icon': 'boat'},
                {'id': 5, 'title': 'Wear Life Jacket', 'description': 'Always wear a life jacket when on water.', 'icon': 'life_jacket'},
                {'id': 6, 'title': 'Share Location', 'description': 'Share your GPS coordinates with emergency contacts.', 'icon': 'location'},
                {'id': 7, 'title': 'Conserve Battery', 'description': 'Turn off unnecessary apps to conserve phone battery.', 'icon': 'battery'},
                {'id': 8, 'title': 'Stay Visible', 'description': 'Stay in open areas where you can be seen from air or sea.', 'icon': 'visible'},
            ],
            'emergency_numbers': {
                'coast_guard': '1554',
                'police': '100',
                'ambulance': '108',
                'fire': '101',
                'disaster': '1070',
                'fishing_helpline': '1800-425-4747',
            },
            'cached_at': timezone.now().isoformat(),
        })


class EmergencyNearestContactsView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        contact_type = request.query_params.get('type')
        limit = int(request.query_params.get('limit', 10))

        qs = EmergencyContact.objects.filter(is_active=True)

        if contact_type:
            qs = qs.filter(contact_type=contact_type)

        if lat and lng:
            from django.contrib.gis.geos import Point
            from django.contrib.gis.measure import D
            point = Point(float(lng), float(lat), srid=4326)
            qs = qs.filter(
                location__distance_lte=(point, D(km=100))
            ).distance(point).order_by('distance')[:limit]
        else:
            qs = qs[:limit]

        from .serializers import EmergencyContactSerializer
        serializer = EmergencyContactSerializer(qs, many=True)
        return Response(serializer.data)
