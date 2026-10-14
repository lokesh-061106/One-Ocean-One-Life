from django.core.management.base import BaseCommand
from django.contrib.gis.geos import MultiPolygon, Polygon, Point
from locations.models import Zone, District, Village


ZONES_DATA = [
    {
        'name': 'North Coast',
        'slug': 'north-coast',
        'zone_number': 1,
        'districts': [
            {'name': 'Tiruvallur', 'slug': 'tiruvallur'},
            {'name': 'Chennai', 'slug': 'chennai'},
            {'name': 'Chengalpattu', 'slug': 'chengalpattu'},
        ]
    },
    {
        'name': 'North-Central Coast',
        'slug': 'north-central-coast',
        'zone_number': 2,
        'districts': [
            {'name': 'Villupuram', 'slug': 'villupuram'},
            {'name': 'Cuddalore', 'slug': 'cuddalore'},
            {'name': 'Mayiladuthurai', 'slug': 'mayiladuthurai'},
        ]
    },
    {
        'name': 'Cauvery Delta Coast',
        'slug': 'cauvery-delta-coast',
        'zone_number': 3,
        'districts': [
            {'name': 'Nagapattinam', 'slug': 'nagapattinam'},
            {'name': 'Tiruvarur', 'slug': 'tiruvarur'},
            {'name': 'Thanjavur', 'slug': 'thanjavur'},
            {'name': 'Pudukkottai', 'slug': 'pudukkottai'},
        ]
    },
    {
        'name': 'Gulf of Mannar Coast',
        'slug': 'gulf-of-mannar-coast',
        'zone_number': 4,
        'districts': [
            {'name': 'Ramanathapuram', 'slug': 'ramanathapuram'},
            {'name': 'Thoothukudi', 'slug': 'thoothukudi'},
        ]
    },
    {
        'name': 'Southern Cape Coast',
        'slug': 'southern-cape-coast',
        'zone_number': 5,
        'districts': [
            {'name': 'Tirunelveli', 'slug': 'tirunelveli'},
            {'name': 'Kanyakumari', 'slug': 'kanyakumari'},
        ]
    },
]


def create_dummy_boundary():
    coords = [
        (79.8, 10.7),
        (79.9, 10.7),
        (79.9, 10.8),
        (79.8, 10.8),
        (79.8, 10.7),
    ]
    return MultiPolygon([Polygon(coords)])


def create_dummy_point(lng=79.85, lat=10.76):
    return Point(lng, lat, srid=4326)


class Command(BaseCommand):
    help = 'Seed Tamil Nadu coastal zones, districts, and sample villages'

    def handle(self, *args, **options):
        self.stdout.write('Seeding zones...')

        for zone_data in ZONES_DATA:
            zone, created = Zone.objects.get_or_create(
                slug=zone_data['slug'],
                defaults={
                    'name': zone_data['name'],
                    'zone_number': zone_data['zone_number'],
                    'boundary': create_dummy_boundary(),
                    'description': f"Coastal Zone {zone_data['zone_number']} — {zone_data['name']}",
                }
            )
            if created:
                self.stdout.write(f'  Created zone: {zone}')
            else:
                self.stdout.write(f'  Zone already exists: {zone}')

            for district_data in zone_data['districts']:
                district, created = District.objects.get_or_create(
                    slug=district_data['slug'],
                    defaults={
                        'name': district_data['name'],
                        'zone': zone,
                        'boundary': create_dummy_boundary(),
                        'state': 'Tamil Nadu',
                    }
                )
                if created:
                    self.stdout.write(f'    Created district: {district}')
                else:
                    self.stdout.write(f'    District already exists: {district}')

        self.stdout.write(self.style.SUCCESS('Done! Zones and districts seeded.'))
        self.stdout.write('Note: Replace dummy boundaries with actual GIS data for production.')
