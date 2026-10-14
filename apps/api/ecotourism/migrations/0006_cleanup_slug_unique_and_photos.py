# Enforce unique slugs now that they are backfilled, and add cleanup photos.

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ecotourism', '0005_beachcleanupevent_slug'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='beachcleanupevent',
            name='slug',
            field=models.SlugField(blank=True, max_length=240, unique=True),
        ),
        migrations.CreateModel(
            name='BeachCleanupPhoto',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('image', models.ImageField(upload_to='cleanups/photos/')),
                ('caption', models.CharField(blank=True, max_length=200)),
                ('sort_order', models.IntegerField(default=0)),
                ('cleanup', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='photos', to='ecotourism.beachcleanupevent')),
                ('uploaded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cleanup_photos', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'beach_cleanup_photos',
                'ordering': ['sort_order', 'created_at'],
            },
        ),
    ]
