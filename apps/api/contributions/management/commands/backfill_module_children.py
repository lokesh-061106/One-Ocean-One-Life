"""Backfill module child records for verified contributions missing them.

Usage:
    python manage.py backfill_module_children [--dry-run] [--type marine_sighting]
"""
from django.core.management.base import BaseCommand

from contributions.models import Contribution
from contributions.publishing import _has_content, publish_contribution


MODULE_TYPES = (
    'marine_sighting', 'ocean_sound', 'education_post', 'local_knowledge',
    'fish_catch', 'observation', 'event', 'beach_cleanup',
)

ACCESSORS = {
    'marine_sighting': ['marine_sighting'],
    'ocean_sound': ['ocean_sound', 'sound_item'],
    'education_post': ['education_post'],
    'local_knowledge': ['guide_species'],
    'fish_catch': ['fish_catch'],
    'observation': ['observation'],
    'event': ['event'],
    'beach_cleanup': ['beach_cleanup', 'event'],
}

# Types where _ensure_* refuses to mint a child for an empty submission.
# Reported separately so a blank legacy row isn't counted as a failure.
CONTENT_GATED_TYPES = {'education_post', 'local_knowledge', 'observation'}


def _gated_out(c):
    """True when the publishing content gate would refuse to mint a child."""
    if _has_content(c):
        return False
    # observation also accepts a media-only submission
    return not (c.type == 'observation' and c.media.exists())


class Command(BaseCommand):
    help = 'Create missing module child rows for verified contributions.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Report only, do not write.')
        parser.add_argument('--type', dest='contribution_type', choices=MODULE_TYPES,
                            help='Limit to a single contribution type.')

    def handle(self, *args, **options):
        dry = options['dry_run']
        type_filter = options.get('contribution_type')

        qs = Contribution.objects.filter(status='verified', type__in=MODULE_TYPES)
        if type_filter:
            qs = qs.filter(type=type_filter)

        total = qs.count()
        created_count = 0
        already_ok = 0
        repaired = 0
        failed = 0
        blank = 0

        self.stdout.write(f'Scanning {total} verified contribution(s)…')

        for c in qs.iterator(chunk_size=50):
            if c.type in CONTENT_GATED_TYPES and _gated_out(c):
                blank += 1
                continue

            had_child = self._has_child(c)
            needs_repair = (
                c.visibility_status != 'COMMUNITY_VISIBLE' or not c.verified_at
            )

            if had_child and not needs_repair:
                already_ok += 1
                continue

            label = f'{c.type} "{c.title or c.pk}"'
            if dry:
                action = 'repair' if had_child else 'publish'
                self.stdout.write(f'  WOULD {action.upper()}: {label}')
                if had_child:
                    repaired += 1
                else:
                    created_count += 1
                continue

            try:
                children = publish_contribution(c)
                if had_child:
                    repaired += 1
                    self.stdout.write(self.style.SUCCESS(f'  REPAIRED: {label}'))
                elif children:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'  PUBLISHED: {label} -> {[type(x).__name__ for x in children]}'
                    ))
                else:
                    failed += 1
                    self.stdout.write(self.style.WARNING(
                        f'  NO CHILD CREATED (missing required media?): {label}'
                    ))
            except Exception as exc:
                failed += 1
                self.stdout.write(self.style.ERROR(f'  FAILED: {label} — {exc}'))

        verb_p = 'would publish' if dry else 'published'
        verb_r = 'would repair' if dry else 'repaired'
        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {created_count} {verb_p}, {repaired} {verb_r}, '
            f'{already_ok} already OK, {blank} skipped (no content), {failed} failed.'
        ))

    @staticmethod
    def _has_child(c):
        accessors = ACCESSORS.get(c.type)
        if not accessors:
            return True
        # ocean_sound mirrors into TWO tables (OceanSound + curated SoundItem);
        # both must exist or the row still needs a repair pass.
        for accessor in accessors:
            try:
                if getattr(c, accessor) is None:
                    return False
            except Exception:
                return False
        return True
