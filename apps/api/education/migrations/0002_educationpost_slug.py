from django.db import migrations, models
from django.utils.text import slugify


def populate_slugs(apps, schema_editor):
    EducationPost = apps.get_model('education', 'EducationPost')
    taken = set(
        EducationPost.objects.exclude(slug='').values_list('slug', flat=True)
    )
    for post in EducationPost.objects.all().order_by('created_at'):
        if post.slug:
            continue
        base = slugify(post.title)[:200] or 'post'
        slug = base
        suffix = 2
        while slug in taken or EducationPost.objects.filter(slug=slug).exists():
            slug = f'{base}-{suffix}'
            suffix += 1
        post.slug = slug
        post.save(update_fields=['slug'])
        taken.add(slug)


class Migration(migrations.Migration):

    dependencies = [
        ('education', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='educationpost',
            name='slug',
            field=models.SlugField(blank=True, db_index=False, default='', max_length=250),
        ),
        migrations.RunPython(populate_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='educationpost',
            name='slug',
            field=models.SlugField(blank=True, max_length=250, unique=True),
        ),
    ]
