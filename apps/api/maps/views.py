from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Q
from core.permissions import IsAdmin
from .models import OceanHotspot, EmergencyContact
from .serializers import (
    OceanHotspotSerializer, OceanHotspotGeoJSONSerializer,
    OceanHotspotCreateUpdateSerializer,
    EmergencyContactSerializer, EmergencyContactCreateUpdateSerializer,
)


class OceanHotspotListView(generics.ListAPIView):
    serializer_class = OceanHotspotSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['density_level', 'zone']
    ordering_fields = ['contribution_count', 'quality_score']
    queryset = OceanHotspot.objects.select_related('zone').all()


class OceanHotspotGeoJSONView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = OceanHotspot.objects.select_related('zone').all()

        density = request.query_params.get('density')
        if density:
            qs = qs.filter(density_level=density)

        zone = request.query_params.get('zone')
        if zone:
            qs = qs.filter(zone__slug=zone)

        min_count = request.query_params.get('min_count')
        if min_count:
            qs = qs.filter(contribution_count__gte=int(min_count))

        features = []
        for hotspot in qs:
            center = hotspot.center
            features.append({
                'type': 'Feature',
                'id': str(hotspot.id),
                'geometry': {
                    'type': 'Point',
                    'coordinates': [center.x, center.y],
                },
                'properties': {
                    'cell_id': hotspot.cell_id,
                    'contribution_count': hotspot.contribution_count,
                    'quality_score': hotspot.quality_score,
                    'density_level': hotspot.density_level,
                    'zone_name': hotspot.zone.name if hotspot.zone else None,
                    'last_calculated': hotspot.last_calculated.isoformat() if hotspot.last_calculated else None,
                },
            })

        return Response({
            'type': 'FeatureCollection',
            'features': features,
            'count': len(features),
        })


class OceanHotspotCreateView(generics.CreateAPIView):
    serializer_class = OceanHotspotCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = OceanHotspot.objects.all()


class OceanHotspotUpdateView(generics.UpdateAPIView):
    serializer_class = OceanHotspotCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = OceanHotspot.objects.all()


class OceanHotspotDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = OceanHotspot.objects.all()


class EmergencyContactListView(generics.ListAPIView):
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['contact_type', 'district', 'is_active']
    search_fields = ['name']
    queryset = EmergencyContact.objects.select_related('village', 'district').filter(is_active=True)


class EmergencyNearbyView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius_km = float(request.query_params.get('radius', 50))

        if not lat or not lng:
            contacts = EmergencyContact.objects.filter(is_active=True)[:20]
        else:
            point = Point(float(lng), float(lat), srid=4326)
            contacts = EmergencyContact.objects.filter(
                is_active=True,
                location__distance_lte=(point, D(km=radius_km))
            ).distance(point).order_by('distance')[:20]

        serializer = EmergencyContactSerializer(contacts, many=True, context={'request': request})
        return Response(serializer.data)


class EmergencyContactCreateView(generics.CreateAPIView):
    serializer_class = EmergencyContactCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = EmergencyContact.objects.all()


class EmergencyContactUpdateView(generics.UpdateAPIView):
    serializer_class = EmergencyContactCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = EmergencyContact.objects.all()


class EmergencyContactDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = EmergencyContact.objects.all()


class MapObservationsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius_km = float(request.query_params.get('radius', 50))
        observation_type = request.query_params.get('type', 'all')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        quality_min = request.query_params.get('quality_min')
        species = request.query_params.get('species')
        village = request.query_params.get('village')
        zone = request.query_params.get('zone')
        limit = int(request.query_params.get('limit', 200))

        result = {}

        if observation_type in ('all', 'contributions'):
            from contributions.models import Contribution
            from accounts.models import Profile
            qs = Contribution.objects.filter(
                location__isnull=False,
                status__in=['verified', 'submitted', 'auto_validated'],
            )
            if date_from:
                qs = qs.filter(created_at__date__gte=date_from)
            if date_to:
                qs = qs.filter(created_at__date__lte=date_to)
            if quality_min:
                qs = qs.filter(quality_score__gte=float(quality_min))
            if village:
                qs = qs.filter(village__slug=village)
            if zone:
                qs = qs.filter(zone__slug=zone)
            if lat and lng:
                point = Point(float(lng), float(lat), srid=4326)
                qs = qs.filter(location__distance_lte=(point, D(km=radius_km)))

            contributions = []
            for c in qs.select_related('user', 'village')[:limit]:
                loc = c.location
                if loc:
                    contributions.append({
                        'id': str(c.id),
                        'latitude': loc.y,
                        'longitude': loc.x,
                        'type': c.type,
                        'status': c.status,
                        'quality_score': c.quality_score,
                        'created_at': c.created_at.isoformat(),
                        'user_name': c.user.username,
                        'village_name': c.village.name if c.village else None,
                    })
            result['contributions'] = contributions

        if observation_type in ('all', 'sightings'):
            from sightings.models import MarineSighting
            qs = MarineSighting.objects.filter(
                contribution__location__isnull=False,
                contribution__status__in=['verified', 'submitted', 'auto_validated'],
            )
            if date_from:
                qs = qs.filter(sighting_date__gte=date_from)
            if date_to:
                qs = qs.filter(sighting_date__lte=date_to)
            if species:
                qs = Q(species__slug=species) | Q(ai_species_suggestion__icontains=species)

            sightings = []
            for s in qs.select_related('species', 'contribution')[:limit]:
                loc = s.contribution.location
                if loc:
                    sightings.append({
                        'id': str(s.id),
                        'latitude': loc.y,
                        'longitude': loc.x,
                        'species_name': s.species.common_name if s.species else s.ai_species_suggestion,
                        'number_observed': s.number_observed,
                        'behavior': s.behavior,
                        'photo_url': s.photo.url if s.photo else None,
                        'sighting_date': str(s.sighting_date) if s.sighting_date else None,
                        'created_at': s.created_at.isoformat(),
                    })
            result['sightings'] = sightings

        if observation_type in ('all', 'sounds'):
            from ocean_sounds.models import OceanSound
            qs = OceanSound.objects.filter(
                contribution__location__isnull=False,
                contribution__status__in=['verified', 'submitted', 'auto_validated'],
            )
            if date_from:
                qs = qs.filter(recording_date__gte=date_from)
            if date_to:
                qs = qs.filter(recording_date__lte=date_to)

            sounds = []
            for s in qs.select_related('contribution')[:limit]:
                loc = s.contribution.location
                if loc:
                    sounds.append({
                        'id': str(s.id),
                        'latitude': loc.y,
                        'longitude': loc.x,
                        'instrument': s.instrument,
                        'duration_seconds': s.duration_seconds,
                        'recording_date': str(s.recording_date) if s.recording_date else None,
                        'created_at': s.created_at.isoformat(),
                    })
            result['sounds'] = sounds

        return Response(result)
