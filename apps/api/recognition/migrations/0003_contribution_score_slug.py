from django.db import migrations, models
from django.utils.text import slugify


def build_slug(user_id, username, first_name, last_name):
    name = f"{first_name} {last_name}".strip() or username
    base = slugify(name)[:56].strip('-') or slugify(username)[:56].strip('-') or 'contributor'
    return f"{base}-{str(user_id)[:6]}"


def backfill_slugs(apps, schema_editor):
    ContributionScore = apps.get_model('recognition', 'ContributionScore')
    User = apps.get_model('accounts', 'User')

    user_map = {
        row[0]: (row[1], row[2], row[3])
        for row in User.objects.values_list('id', 'username', 'first_name', 'last_name')
    }
    taken = set(
        ContributionScore.objects.exclude(slug='').values_list('slug', flat=True)
    )
    for pk, user_id, _ts, _qs in ContributionScore.objects.values_list(
        'pk', 'user_id', 'total_score', 'slug'
    ).iterator():
        username, first_name, last_name = user_map.get(user_id, ('', '', ''))
        slug = build_slug(user_id, username, first_name, last_name)
        # Guard against any pre-existing value colliding with a fresh one.
        if slug in taken:
            candidate = f"{slug}-{pk}"
            n = 2
            while candidate in taken:
                candidate = f"{slug}-{n}"
                n += 1
            slug = candidate
        taken.add(slug)
        ContributionScore.objects.filter(pk=pk).update(slug=slug)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('recognition', '0002_badgedefinition_leaderboardsnapshot_tierthreshold_and_more'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='contributionscore',
            name='slug',
            field=models.SlugField(blank=True, default='', max_length=80),
            preserve_default=False,
        ),
        migrations.RunPython(backfill_slugs, noop),
    ]
