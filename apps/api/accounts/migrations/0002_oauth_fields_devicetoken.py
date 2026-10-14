# New fields for accounts app

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='oauth_provider',
            field=models.CharField(blank=True, db_index=True, max_length=20),
        ),
        migrations.AddField(
            model_name='user',
            name='oauth_provider_id',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='user',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='gender',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='user',
            name='age_range',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='user',
            name='languages',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='user',
            name='skills',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='user',
            name='years_of_experience',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='areas_of_expertise',
            field=models.TextField(blank=True),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['oauth_provider', 'oauth_provider_id'], name='users_oauth_pr_b3b7e1_idx'),
        ),
        migrations.CreateModel(
            name='DeviceToken',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('device_token', models.CharField(max_length=500)),
                ('platform', models.CharField(choices=[('android', 'Android'), ('ios', 'iOS'), ('web', 'Web')], max_length=10)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='device_tokens', to='accounts.user')),
            ],
            options={
                'db_table': 'device_tokens',
                'indexes': [
                    models.Index(fields=['user', 'is_active'], name='device_toke_user_id_e5f6a7_idx'),
                    models.Index(fields=['device_token'], name='device_toke_device__a1b2c3_idx'),
                ],
            },
        ),
    ]
