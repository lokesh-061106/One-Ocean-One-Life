from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recognition', '0003_contribution_score_slug'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contributionscore',
            name='slug',
            field=models.SlugField(blank=True, db_index=True, max_length=80, unique=True),
        ),
    ]
