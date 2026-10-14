# Add slug column and backfill existing rows (no unique yet).

from django.db import migrations, models
from django.utils.text import slugify


def _slugify(title):
    return (slugify(title or '')[:190] or 'cleanup')


def backfill_slugs(apps, schema_editor):
    BeachCleanupEvent = apps.get_model('ecotourism', 'BeachCleanupEvent')
    seen = set()
    for obj in BeachCleanupEvent.objects.all().order_by('created_at'):
        base = _slugify(obj.title)
        slug = base
        counter = 2
        while slug in seen:
            slug = f'{base}-{counter}'
            counter += 1
        seen.add(slug)
        if obj.slug != slug:
            obj.slug = slug
            obj.save(update_fields=['slug'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('ecotourism', '0004_beachcleanupevent_contribution_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='beachcleanupevent',
            name='slug',
            field=models.SlugField(blank=True, default='', max_length=240),
            preserve_default=False,
        ),
        migrations.RunPython(backfill_slugs, noop),
    ]
