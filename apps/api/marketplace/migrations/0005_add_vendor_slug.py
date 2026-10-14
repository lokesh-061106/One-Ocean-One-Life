from django.db import migrations, models
from django.utils.text import slugify


def backfill_vendor_slugs(apps, schema_editor):
    Vendor = apps.get_model('marketplace', 'Vendor')
    used = set()

    qs = Vendor.objects.all().order_by('created_at')
    for vendor in qs.iterator():
        base = slugify(vendor.shop_name or '')[:180] or 'vendor'
        slug = base
        counter = 2
        while slug in used:
            slug = f"{base}-{counter}"
            counter += 1
        used.add(slug)

        vendor.slug = slug
        vendor.save(update_fields=['slug'])


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0004_alter_product_slug_agencyreferral_datalisting_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='vendor',
            name='slug',
            field=models.SlugField(blank=True, db_index=False, default='', max_length=220),
        ),
        migrations.RunPython(backfill_vendor_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='vendor',
            name='slug',
            field=models.SlugField(blank=True, max_length=220, unique=True),
        ),
    ]
