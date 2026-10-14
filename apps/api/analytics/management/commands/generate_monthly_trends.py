from datetime import datetime, timezone as dt_timezone
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum
from analytics.models import MonthlyTrend
from contributions.models import Contribution
from accounts.models import User, Profile
from community.models import Event
from sightings.models import MarineSighting
from ocean_sounds.models import OceanSound
from locations.models import Village


class Command(BaseCommand):
    help = 'Generate monthly trend data for analytics'

    def add_arguments(self, parser):
        parser.add_argument('--year', type=int, default=None, help='Year to generate (default: current year)')

    def handle(self, *args, **options):
        year = options['year'] or timezone.now().year
        self.stdout.write(f'Generating monthly trends for {year}...')

        for month in range(1, 13):
            m_start = datetime(year, month, 1, tzinfo=dt_timezone.utc)
            if month == 12:
                m_end = datetime(year + 1, 1, 1, tzinfo=dt_timezone.utc)
            else:
                m_end = datetime(year, month + 1, 1, tzinfo=dt_timezone.utc)

            contributions = Contribution.objects.filter(created_at__gte=m_start, created_at__lt=m_end)
            verified = contributions.filter(status='verified')

            trend, _ = MonthlyTrend.objects.update_or_create(
                year=year, month=month,
                defaults={
                    'contributions_count': contributions.count(),
                    'verified_count': verified.count(),
                    'new_users': User.objects.filter(date_joined__gte=m_start, date_joined__lt=m_end).count(),
                    'active_users': Profile.objects.filter(last_active_at__gte=m_start, last_active_at__lt=m_end).count(),
                    'sightings_count': MarineSighting.objects.filter(created_at__gte=m_start, created_at__lt=m_end).count(),
                    'sounds_count': OceanSound.objects.filter(created_at__gte=m_start, created_at__lt=m_end).count(),
                    'events_count': Event.objects.filter(start_date__gte=m_start, start_date__lt=m_end).count(),
                    'points_awarded': contributions.aggregate(t=Sum('points'))['t'] or 0,
                    'villages_active': Village.objects.filter(
                        contribution__created_at__gte=m_start, contribution__created_at__lt=m_end
                    ).distinct().count(),
                }
            )

        self.stdout.write(self.style.SUCCESS(f'Monthly trends for {year} generated.'))
