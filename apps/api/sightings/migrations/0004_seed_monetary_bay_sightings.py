# Seeded MarineSightings for the "List of Marine Mammal Sighted at Monetary Bay" category.
# The list items are real sightings (marine_sightings rows), not category species entries.

from django.db import migrations

CATEGORY_SLUG = 'list-of-marine-mammal-sighted-at-monetary-bay'
SIGHTING_NAMES = [
    'Blue Shark',
    'Blue Whale',
    'Common Dolphin',
    "Cuvier's Beaked Whale",
]


def create_sightings(apps, schema_editor):
    SightingCategory = apps.get_model('sightings', 'SightingCategory')
    SightingCategorySpecies = apps.get_model('sightings', 'SightingCategorySpecies')
    MarineSighting = apps.get_model('sightings', 'MarineSighting')
    Contribution = apps.get_model('contributions', 'Contribution')
    User = apps.get_model('accounts', 'User')

    category = SightingCategory.objects.filter(slug=CATEGORY_SLUG).first()
    if category is None:
        return

    SightingCategorySpecies.objects.filter(category=category).delete()

    user = User.objects.filter(is_superuser=True).order_by('date_joined').first()
    if user is None:
        user = User.objects.order_by('date_joined').first()
    if user is None:
        return

    for name in SIGHTING_NAMES:
        if MarineSighting.objects.filter(category=category, ai_species_suggestion=name).exists():
            continue
        contribution = Contribution.objects.create(
            user=user,
            type='marine_sighting',
            status='submitted',
            notes='Reference sighting — List of Marine Mammal Sighted at Monetary Bay.',
        )
        MarineSighting.objects.create(
            contribution=contribution,
            category=category,
            ai_species_suggestion=name,
            behavior='unknown',
            number_observed=1,
        )


def remove_sightings(apps, schema_editor):
    SightingCategory = apps.get_model('sightings', 'SightingCategory')
    MarineSighting = apps.get_model('sightings', 'MarineSighting')
    Contribution = apps.get_model('contributions', 'Contribution')

    category = SightingCategory.objects.filter(slug=CATEGORY_SLUG).first()
    if category is None:
        return
    for sighting in MarineSighting.objects.filter(category=category):
        contribution_id = sighting.contribution_id
        sighting.delete()
        Contribution.objects.filter(pk=contribution_id).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('sightings', '0003_sightingcategoryspecies'),
        ('contributions', '0001_initial'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_sightings, remove_sightings),
    ]
