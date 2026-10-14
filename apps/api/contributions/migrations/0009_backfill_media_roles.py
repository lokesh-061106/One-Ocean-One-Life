from django.db import migrations


def backfill_media_roles(apps, schema_editor):
    """Existing rows were all created as 'general' — give them the right role."""
    ContributionMedia = apps.get_model('contributions', 'ContributionMedia')
    for kind, role in (
        ('audio', 'primary_audio'),
        ('video', 'video'),
        ('document', 'document'),
    ):
        ContributionMedia.objects.filter(kind=kind).update(role=role)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('contributions', '0008_contribution_contributor_type_contributionmedia_role_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_media_roles, noop),
    ]
