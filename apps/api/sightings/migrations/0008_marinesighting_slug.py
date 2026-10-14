from django.db import migrations, models
from django.utils.text import slugify


def backfill_slugs(apps, schema_editor):
    MarineSighting = apps.get_model('sightings', 'MarineSighting')
    used = set()

    qs = MarineSighting.objects.all().order_by('created_at')
    for sighting in qs.iterator():
        name = ''
        if sighting.species_id and sighting.species:
            name = sighting.species.common_name or ''
        if not name and sighting.ai_species_suggestion:
            name = sighting.ai_species_suggestion
        if not name and sighting.category_id and sighting.category:
            name = sighting.category.name or ''
        if not name:
            name = 'marine-sighting'

        base = slugify(name)[:190] or 'marine-sighting'
        slug = base
        counter = 2
        while slug in used:
            slug = f"{base}-{counter}"
            counter += 1
        used.add(slug)

        sighting.slug = slug
        sighting.save(update_fields=['slug'])


class Migration(migrations.Migration):

    dependencies = [
        ('sightings', '0007_alter_sightingdocument_document'),
    ]

    operations = [
        migrations.AddField(
            model_name='marinesighting',
            name='slug',
            field=models.SlugField(blank=True, db_index=False, default='', max_length=240),
        ),
        migrations.RunPython(backfill_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='marinesighting',
            name='slug',
            field=models.SlugField(blank=True, max_length=240, unique=True),
        ),
    ]
