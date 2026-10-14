from django.db import migrations, models
from django.utils.text import slugify
import uuid


def populate_slugs(apps, schema_editor):
    Product = apps.get_model('marketplace', 'Product')
    used_slugs = set()
    for product in Product.objects.all():
        base_slug = slugify(product.name)
        if not base_slug:
            base_slug = str(uuid.uuid4())[:8]
        slug = base_slug
        counter = 1
        while slug in used_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1
        used_slugs.add(slug)
        Product.objects.filter(pk=product.pk).update(slug=slug)


def reverse_populate(apps, schema_editor):
    Product = apps.get_model('marketplace', 'Product')
    Product.objects.all().update(slug='')


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0002_add_product_slug'),
    ]

    operations = [
        migrations.RunPython(populate_slugs, reverse_populate),
        migrations.AlterField(
            model_name='product',
            name='slug',
            field=models.SlugField(max_length=350, unique=True),
        ),
    ]
