import math
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point, Polygon, MultiPolygon
from django.contrib.gis.measure import D
from django.utils import timezone
from django.db.models import Sum, Count, Q, F
from maps.models import OceanHotspot
from contributions.models import Contribution
from locations.models import Zone


CELL_SIZE_KM = 2.0
TAMIL_NADU_BOUNDS = {
    'min_lat': 8.0,
    'max_lat': 13.5,
    'min_lng': 76.5,
    'max_lng': 80.5,
}

DENSITY_THRESHOLDS = {
    'low': 1,
    'medium': 5,
    'high': 15,
    'very_high': 30,
}

QUALITY_WEIGHTS = {
    'verified': 1.0,
    'auto_validated': 0.7,
    'submitted': 0.4,
    'moderator_review': 0.5,
    'scientific_review': 0.8,
    'draft': 0.1,
}


class Command(BaseCommand):
    help = 'Generate ocean contribution hotspots using hexagonal grid aggregation'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days', type=int, default=365,
            help='Number of days to look back (default: 365)'
        )
        parser.add_argument(
            '--cell-size', type=float, default=CELL_SIZE_KM,
            help='Cell size in kilometers (default: 2.0)'
        )
        parser.add_argument(
            '--zone', type=str, default=None,
            help='Zone slug to process (default: all zones)'
        )

    def handle(self, *args, **options):
        days = options['days']
        cell_size_km = options['cell_size']
        zone_slug = options['zone']

        self.stdout.write(f'Generating hotspots (last {days} days, cell size: {cell_size_km}km)...')

        since = timezone.now() - timedelta(days=days)

        contributions = Contribution.objects.filter(
            created_at__gte=since,
            location__isnull=False,
            status__in=['verified', 'submitted', 'auto_validated', 'moderator_review', 'scientific_review'],
        )

        if zone_slug:
            contributions = contributions.filter(zone__slug=zone_slug)

        contributions = contributions.select_related('zone').values(
            'id', 'location', 'status', 'quality_score', 'type', 'zone_id'
        )

        points = []
        for c in contributions:
            try:
                loc = c['location']
                if loc is not None:
                    lng, lat = loc.x, loc.y
                    if (TAMIL_NADU_BOUNDS['min_lat'] <= lat <= TAMIL_NADU_BOUNDS['max_lat'] and
                        TAMIL_NADU_BOUNDS['min_lng'] <= lng <= TAMIL_NADU_BOUNDS['max_lng']):
                        points.append({
                            'lat': lat,
                            'lng': lng,
                            'status': c['status'],
                            'quality': c['quality_score'],
                            'type': c['type'],
                            'zone_id': c['zone_id'],
                        })
            except Exception:
                continue

        self.stdout.write(f'Found {len(points)} contributions with valid locations')

        if not points:
            self.stdout.write('No contributions found. Exiting.')
            return

        cells = self._build_hex_grid(points, cell_size_km)
        self.stdout.write(f'Generated {len(cells)} active cells')

        OceanHotspot.objects.all().delete()

        created = 0
        for cell_id, cell_data in cells.items():
            center_lat = cell_data['center_lat']
            center_lng = cell_data['center_lng']
            zone = self._find_zone(center_lat, center_lng)

            weighted_score = cell_data['weighted_score']
            count = cell_data['count']
            quality_avg = cell_data['quality_avg']

            density_level = self._classify_density(count)

            geometry = self._create_cell_polygon(center_lat, center_lng, cell_size_km)
            center_point = Point(center_lng, center_lat, srid=4326)

            OceanHotspot.objects.create(
                cell_id=cell_id,
                geometry=geometry,
                center=center_point,
                contribution_count=count,
                quality_score=round(quality_avg, 2),
                density_level=density_level,
                last_calculated=timezone.now(),
                zone=zone,
            )
            created += 1

        self.stdout.write(self.style.SUCCESS(f'Created {created} hotspot cells'))
        self._print_summary()

    def _build_hex_grid(self, points, cell_size_km):
        cells = {}
        cell_size_deg = cell_size_km / 111.0

        for point in points:
            cell_lat = round(point['lat'] / cell_size_deg) * cell_size_deg
            cell_lng = round(point['lng'] / cell_size_deg) * cell_size_deg
            cell_id = f"{cell_lat:.4f}_{cell_lng:.4f}"

            if cell_id not in cells:
                cells[cell_id] = {
                    'center_lat': cell_lat,
                    'center_lng': cell_lng,
                    'count': 0,
                    'weighted_sum': 0,
                    'quality_sum': 0,
                    'types': {},
                    'zone_id': None,
                }

            cell = cells[cell_id]
            cell['count'] += 1

            weight = QUALITY_WEIGHTS.get(point['status'], 0.3)
            cell['weighted_sum'] += weight
            cell['quality_sum'] += point['quality']

            cell['types'][point['type']] = cell['types'].get(point['type'], 0) + 1

            if point['zone_id'] and not cell['zone_id']:
                cell['zone_id'] = point['zone_id']

        for cell_id, cell in cells.items():
            cell['weighted_score'] = cell['weighted_sum']
            cell['quality_avg'] = cell['quality_sum'] / cell['count'] if cell['count'] > 0 else 0

        return cells

    def _classify_density(self, count):
        if count >= DENSITY_THRESHOLDS['very_high']:
            return 'very_high'
        elif count >= DENSITY_THRESHOLDS['high']:
            return 'high'
        elif count >= DENSITY_THRESHOLDS['medium']:
            return 'medium'
        return 'low'

    def _create_cell_polygon(self, center_lat, center_lng, size_km):
        half = size_km / 2.0 / 111.0
        cos_lat = math.cos(math.radians(center_lat))
        half_lng = half / cos_lat if cos_lat > 0 else half

        coords = [
            (center_lng - half_lng, center_lat - half),
            (center_lng + half_lng, center_lat - half),
            (center_lng + half_lng, center_lat + half),
            (center_lng - half_lng, center_lat + half),
            (center_lng - half_lng, center_lat - half),
        ]
        return Polygon(coords, srid=4326)

    def _find_zone(self, lat, lng):
        try:
            point = Point(lng, lat, srid=4326)
            zones = Zone.objects.filter(boundary__contains=point)
            return zones.first()
        except Exception:
            return None

    def _print_summary(self):
        stats = OceanHotspot.objects.aggregate(
            total=Count('id'),
            very_high=Count('id', filter=Q(density_level='very_high')),
            high=Count('id', filter=Q(density_level='high')),
            medium=Count('id', filter=Q(density_level='medium')),
            low=Count('id', filter=Q(density_level='low')),
            total_contributions=Sum('contribution_count'),
        )
        self.stdout.write(f'\nSummary:')
        self.stdout.write(f'  Total cells: {stats["total"]}')
        self.stdout.write(f'  Very High: {stats["very_high"]}')
        self.stdout.write(f'  High: {stats["high"]}')
        self.stdout.write(f'  Medium: {stats["medium"]}')
        self.stdout.write(f'  Low: {stats["low"]}')
        self.stdout.write(f'  Total contributions mapped: {stats["total_contributions"] or 0}')
