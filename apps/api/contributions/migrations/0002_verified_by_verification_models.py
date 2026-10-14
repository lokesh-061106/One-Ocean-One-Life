# New fields for contributions app

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('contributions', '0001_initial'),
        ('accounts', '0002_oauth_fields_devicetoken'),
    ]

    operations = [
        migrations.AddField(
            model_name='contribution',
            name='verified_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='verified_contributions',
                to='accounts.user',
            ),
        ),
        migrations.CreateModel(
            name='VerificationLevel',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=50)),
                ('order', models.IntegerField(unique=True)),
                ('required_role', models.CharField(blank=True, max_length=30)),
                ('auto_approve', models.BooleanField(default=False)),
                ('requires_evidence', models.BooleanField(default=True)),
                ('confidence_threshold', models.IntegerField(default=70)),
            ],
            options={
                'db_table': 'verification_levels',
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='VerificationRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('in_review', 'In Review'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('needs_info', 'Needs More Info')], default='pending', max_length=20)),
                ('confidence_score', models.IntegerField(default=0)),
                ('notes', models.TextField(blank=True)),
                ('evidence', models.JSONField(blank=True, default=list)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('contribution', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='verification_requests', to='contributions.contribution')),
                ('level', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contributions.verificationlevel')),
                ('reviewer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verification_reviews', to='accounts.user')),
            ],
            options={
                'db_table': 'verification_requests',
                'indexes': [
                    models.Index(fields=['status', 'level'], name='verificatio_status_f8a9b0_idx'),
                    models.Index(fields=['contribution', 'status'], name='verificatio_contribu_c3d4e5_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='VerificationHistory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('action', models.CharField(max_length=20)),
                ('from_status', models.CharField(max_length=20)),
                ('to_status', models.CharField(max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('confidence_score', models.IntegerField(default=0)),
                ('contribution', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='verification_history', to='contributions.contribution')),
                ('reviewer', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.user')),
            ],
            options={
                'db_table': 'verification_history',
                'ordering': ['-created_at'],
            },
        ),
    ]
