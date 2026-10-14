import csv
import json
from io import StringIO
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from guides.models import GuideSpecies


class ResearchObservationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['RESEARCHER', 'SCIENTIFIC_VALIDATOR', 'ADMIN', 'SUPER_ADMIN']:
            return Response({'error': 'Research access required.'}, status=403)

        data_type = request.query_params.get('type', 'all')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius_km = request.query_params.get('radius')
        quality_min = request.query_params.get('quality_min')
        species = request.query_params.get('species')
        zone = request.query_params.get('zone')
        village = request.query_params.get('village')
        limit = int(request.query_params.get('limit', 500))

        result = {}

        if data_type in ('all', 'sightings'):
            from sightings.models import MarineSighting
            qs = MarineSighting.objects.filter(
                contribution__status='verified'
            ).select_related('species', 'contribution', 'contribution__village', 'contribution__zone')

            if date_from:
                qs = qs.filter(sighting_date__gte=date_from)
            if date_to:
                qs = qs.filter(sighting_date__lte=date_to)
            if species:
                qs = qs.filter(Q(species__slug=species) | Q(ai_species_suggestion__icontains=species))
            if village:
                qs = qs.filter(contribution__village__slug=village)
            if zone:
                qs = qs.filter(contribution__zone__slug=zone)
            if lat and lng:
                point = Point(float(lng), float(lat), srid=4326)
                if radius_km:
                    qs = qs.filter(contribution__location__distance_lte=(point, D(km=float(radius_km))))
            if quality_min:
                qs = qs.filter(contribution__quality_score__gte=float(quality_min))

            sightings = []
            for s in qs[:limit]:
                loc = s.contribution.location
                sightings.append({
                    'id': str(s.id),
                    'latitude': loc.y if loc else None,
                    'longitude': loc.x if loc else None,
                    'species': s.species.common_name if s.species else s.ai_species_suggestion,
                    'scientific_name': s.species.scientific_name if s.species else '',
                    'number_observed': s.number_observed,
                    'behavior': s.behavior,
                    'sea_condition': s.sea_condition,
                    'weather': s.weather,
                    'sighting_date': str(s.sighting_date) if s.sighting_date else None,
                    'sighting_time': str(s.sighting_time) if s.sighting_time else None,
                    'quality_score': s.contribution.quality_score,
                    'village': s.contribution.village.name if s.contribution.village else None,
                    'district': s.contribution.village.district.name if s.contribution.village and s.contribution.village.district else None,
                    'zone': s.contribution.zone.name if s.contribution.zone else None,
                    'contributor': s.contribution.user.username,
                    'notes': s.notes,
                })
            result['sightings'] = sightings
            result['sightings_count'] = len(sightings)

        if data_type in ('all', 'sounds'):
            from ocean_sounds.models import OceanSound
            qs = OceanSound.objects.filter(
                contribution__status='verified'
            ).select_related('contribution', 'contribution__village', 'contribution__zone')

            if date_from:
                qs = qs.filter(recording_date__gte=date_from)
            if date_to:
                qs = qs.filter(recording_date__lte=date_to)
            if village:
                qs = qs.filter(contribution__village__slug=village)
            if zone:
                qs = qs.filter(contribution__zone__slug=zone)
            if lat and lng:
                point = Point(float(lng), float(lat), srid=4326)
                if radius_km:
                    qs = qs.filter(contribution__location__distance_lte=(point, D(km=float(radius_km))))
            if quality_min:
                qs = qs.filter(contribution__quality_score__gte=float(quality_min))

            sounds = []
            for s in qs[:limit]:
                loc = s.contribution.location
                sounds.append({
                    'id': str(s.id),
                    'latitude': loc.y if loc else None,
                    'longitude': loc.x if loc else None,
                    'instrument': s.instrument,
                    'manufacturer': s.manufacturer,
                    'model_number': s.model_number,
                    'depth_meters': s.depth_meters,
                    'measurement_method': s.measurement_method,
                    'frequency_range': s.frequency_range,
                    'duration_seconds': s.duration_seconds,
                    'environmental_conditions': s.environmental_conditions,
                    'recording_date': str(s.recording_date) if s.recording_date else None,
                    'recording_time': str(s.recording_time) if s.recording_time else None,
                    'quality_score': s.contribution.quality_score,
                    'village': s.contribution.village.name if s.contribution.village else None,
                    'district': s.contribution.village.district.name if s.contribution.village and s.contribution.village.district else None,
                    'zone': s.contribution.zone.name if s.contribution.zone else None,
                    'contributor': s.contribution.user.username,
                    'written_description': s.written_description,
                })
            result['sounds'] = sounds
            result['sounds_count'] = len(sounds)

        if data_type in ('all', 'guides'):
            from guides.models import GuideSpecies
            qs = GuideSpecies.objects.filter(is_verified=True)
            if species:
                qs = qs.filter(Q(slug=species) | Q(common_name__icontains=species) | Q(tamil_name__icontains=species))

            guides = []
            for g in qs[:limit]:
                guides.append({
                    'id': str(g.id),
                    'common_name': g.common_name,
                    'tamil_name': g.tamil_name,
                    'scientific_name': g.scientific_name,
                    'conservation_status': g.conservation_status,
                    'latitude': g.latitude,
                    'longitude': g.longitude,
                    'habitat': g.habitat,
                    'distribution': str(g.distribution) if g.distribution else None,
                })
            result['guides'] = guides
            result['guides_count'] = len(guides)

        return Response(result)


class ResearchExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['RESEARCHER', 'SCIENTIFIC_VALIDATOR', 'ADMIN', 'SUPER_ADMIN']:
            return Response({'error': 'Research access required.'}, status=403)

        format_type = request.query_params.get('format', 'csv')
        data_type = request.query_params.get('type', 'sightings')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        zone = request.query_params.get('zone')
        quality_min = request.query_params.get('quality_min')

        if data_type == 'sightings':
            return self._export_sightings(request, format_type, date_from, date_to, zone, quality_min)
        elif data_type == 'sounds':
            return self._export_sounds(request, format_type, date_from, date_to, zone, quality_min)
        elif data_type == 'guides':
            return self._export_guides(request, format_type)
        elif data_type == 'all':
            return self._export_all(request, format_type, date_from, date_to, zone, quality_min)

        return Response({'error': 'Invalid type.'}, status=400)

    def _export_sightings(self, request, fmt, date_from, date_to, zone, quality_min):
        from sightings.models import MarineSighting
        qs = MarineSighting.objects.filter(
            contribution__status='verified'
        ).select_related('species', 'contribution', 'contribution__village')

        if date_from:
            qs = qs.filter(sighting_date__gte=date_from)
        if date_to:
            qs = qs.filter(sighting_date__lte=date_to)
        if zone:
            qs = qs.filter(contribution__zone__slug=zone)
        if quality_min:
            qs = qs.filter(contribution__quality_score__gte=float(quality_min))

        rows = []
        for s in qs[:1000]:
            loc = s.contribution.location
            rows.append({
                'id': str(s.id),
                'latitude': loc.y if loc else '',
                'longitude': loc.x if loc else '',
                'species': s.species.common_name if s.species else s.ai_species_suggestion,
                'scientific_name': s.species.scientific_name if s.species else '',
                'number_observed': s.number_observed,
                'behavior': s.behavior,
                'sea_condition': s.sea_condition,
                'weather': s.weather,
                'sighting_date': str(s.sighting_date) if s.sighting_date else '',
                'sighting_time': str(s.sighting_time) if s.sighting_time else '',
                'quality_score': s.contribution.quality_score,
                'village': s.contribution.village.name if s.contribution.village else '',
                'contributor': s.contribution.user.username,
            })

        if fmt == 'geojson':
            features = []
            for r in rows:
                if r['latitude'] and r['longitude']:
                    features.append({
                        'type': 'Feature',
                        'geometry': {'type': 'Point', 'coordinates': [float(r['longitude']), float(r['latitude'])]},
                        'properties': {k: v for k, v in r.items() if k not in ('latitude', 'longitude')},
                    })
            return Response({'type': 'FeatureCollection', 'features': features})

        if fmt == 'json':
            return Response(rows)

        return self._to_csv(rows, f'sightings_export_{timezone.now().strftime("%Y%m%d")}.csv')

    def _export_sounds(self, request, fmt, date_from, date_to, zone, quality_min):
        from ocean_sounds.models import OceanSound
        qs = OceanSound.objects.filter(
            contribution__status='verified'
        ).select_related('contribution', 'contribution__village')

        if date_from:
            qs = qs.filter(recording_date__gte=date_from)
        if date_to:
            qs = qs.filter(recording_date__lte=date_to)
        if zone:
            qs = qs.filter(contribution__zone__slug=zone)
        if quality_min:
            qs = qs.filter(contribution__quality_score__gte=float(quality_min))

        rows = []
        for s in qs[:1000]:
            loc = s.contribution.location
            rows.append({
                'id': str(s.id),
                'latitude': loc.y if loc else '',
                'longitude': loc.x if loc else '',
                'instrument': s.instrument,
                'manufacturer': s.manufacturer,
                'depth_meters': s.depth_meters or '',
                'frequency_range': s.frequency_range,
                'duration_seconds': s.duration_seconds or '',
                'recording_date': str(s.recording_date) if s.recording_date else '',
                'quality_score': s.contribution.quality_score,
                'village': s.contribution.village.name if s.contribution.village else '',
                'contributor': s.contribution.user.username,
            })

        if fmt == 'geojson':
            features = []
            for r in rows:
                if r['latitude'] and r['longitude']:
                    features.append({
                        'type': 'Feature',
                        'geometry': {'type': 'Point', 'coordinates': [float(r['longitude']), float(r['latitude'])]},
                        'properties': {k: v for k, v in r.items() if k not in ('latitude', 'longitude')},
                    })
            return Response({'type': 'FeatureCollection', 'features': features})

        if fmt == 'json':
            return Response(rows)

        return self._to_csv(rows, f'sounds_export_{timezone.now().strftime("%Y%m%d")}.csv')

    def _export_guides(self, request, fmt):
        from guides.models import GuideSpecies
        qs = GuideSpecies.objects.filter(is_verified=True)

        rows = []
        for g in qs[:1000]:
            rows.append({
                'id': str(g.id),
                'common_name': g.common_name,
                'tamil_name': g.tamil_name,
                'scientific_name': g.scientific_name,
                'conservation_status': g.conservation_status,
                'habitat': g.habitat,
                'latitude': g.latitude or '',
                'longitude': g.longitude or '',
            })

        if fmt == 'json':
            return Response(rows)

        return self._to_csv(rows, f'guides_export_{timezone.now().strftime("%Y%m%d")}.csv')

    def _export_all(self, request, fmt, date_from, date_to, zone, quality_min):
        result = {}
        from sightings.models import MarineSighting
        from ocean_sounds.models import OceanSound

        qs_s = MarineSighting.objects.filter(contribution__status='verified')
        if date_from:
            qs_s = qs_s.filter(sighting_date__gte=date_from)
        if date_to:
            qs_s = qs_s.filter(sighting_date__lte=date_to)
        result['sightings'] = qs_s.count()

        qs_d = OceanSound.objects.filter(contribution__status='verified')
        if date_from:
            qs_d = qs_d.filter(recording_date__gte=date_from)
        if date_to:
            qs_d = qs_d.filter(recording_date__lte=date_to)
        result['sounds'] = qs_d.count()

        result['guides'] = GuideSpecies.objects.filter(is_verified=True).count()

        return Response(result)

    def _to_csv(self, rows, filename):
        if not rows:
            return Response({'error': 'No data to export.'}, status=404)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.DictWriter(response, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
        return response
