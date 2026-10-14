"""
Refresh the scoreboard: backfill B/Q/V/I on contributions, recompute
B×Q×V×I totals, ₹ earnings, tiers and badges for every user.

    python manage.py refresh_scoreboard
    python manage.py refresh_scoreboard --backfill
    python manage.py refresh_scoreboard --user m0103
"""
from decimal import Decimal

from django.core.management.base import BaseCommand

from recognition.services import ensure_badges, ensure_tiers, refresh_all_scores, refresh_user_score


class Command(BaseCommand):
    help = "Backfill contribution scoring fields and refresh every scoreboard record."

    def add_arguments(self, parser):
        parser.add_argument('--backfill', action='store_true',
                            help='Recompute final_score_points = B x Q x V x I on existing contributions')
        parser.add_argument('--user', type=str, default=None, help='Only refresh this username')

    def handle(self, *args, **options):
        ensure_tiers()
        ensure_badges()

        if options['backfill']:
            self._backfill_contributions()

        if options['user']:
            from accounts.models import User

            user = User.objects.filter(username=options['user']).first()
            if not user:
                self.stderr.write(f"User {options['user']} not found")
                return
            result = refresh_user_score(user)
            self.stdout.write(self.style.SUCCESS(f"{user.username}: {result}"))
            return

        updated = refresh_all_scores()
        self.stdout.write(self.style.SUCCESS(f"Refreshed scoreboard for {updated} users"))

    def _backfill_contributions(self):
        from contributions.models import Contribution

        updated = 0
        for c in Contribution.objects.iterator():
            base = Decimal(str(c.base_points or 0))
            q = Decimal(str(c.q_quality or 1))
            v = Decimal(str(c.v_verification or 1))
            i = Decimal(str(c.i_impact or 1))

            if base == 0:
                # legacy row: the stored `points` value is the best available B
                base = Decimal(str(c.points or 10))
                c.base_points = base

            final = round(float(base * q * v * i), 2)
            if round(c.final_score_points or 0, 2) != final or c.points != int(round(final)):
                c.final_score_points = final
                c.points = int(round(final))
                c.save(update_fields=['base_points', 'final_score_points', 'points'])
                updated += 1

        self.stdout.write(f"Backfilled {updated} contributions")
