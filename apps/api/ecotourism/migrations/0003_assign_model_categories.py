from django.db import migrations

TYPE_TO_MODEL_CATEGORY = {
    'whale_watching': 'nature_tours',
    'snorkeling': 'nature_tours',
    'diving': 'nature_tours',
    'boat_tour': 'fisher_coastal',
    'fishing_trip': 'fisher_coastal',
    'bird_watching': 'nature_tours',
    'mangrove_tour': 'nature_tours',
    'beach_tour': 'nature_tours',
    'village_tour': 'homestay_food',
    'cultural_tour': 'homestay_food',
}


def assign_model_categories(apps, schema_editor):
    TourismOpportunity = apps.get_model('ecotourism', 'TourismOpportunity')
    for opp_type, category in TYPE_TO_MODEL_CATEGORY.items():
        TourismOpportunity.objects.filter(opportunity_type=opp_type).update(
            model_category=category
        )


def unset_model_categories(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('ecotourism', '0002_review_splitrule_tourismopportunity_duration_minutes_and_more'),
    ]

    operations = [
        migrations.RunPython(assign_model_categories, unset_model_categories),
    ]
