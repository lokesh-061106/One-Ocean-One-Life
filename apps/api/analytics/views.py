from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime as dt, timezone as dt_timezone
from .models import AnnualReport, MonthlyTrend
from .serializers import (
    AnnualReportSerializer, AnnualReportSummarySerializer,
    MonthlyTrendSerializer, YearComparisonSerializer,
)


class AnnualReportListView(generics.ListAPIView):
    serializer_class = AnnualReportSummarySerializer
    permission_classes = [permissions.AllowAny]
    queryset = AnnualReport.objects.all()


class AnnualReportDetailView(generics.RetrieveAPIView):
    serializer_class = AnnualReportSerializer
    permission_classes = [permissions.AllowAny]
    queryset = AnnualReport.objects.all()


class AnnualReportGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        year = request.data.get('year', timezone.now().year - 1)
        start = dt(year, 1, 1, tzinfo=dt_timezone.utc)
        end = dt(year + 1, 1, 1, tzinfo=dt_timezone.utc)

        from contributions.models import Contribution
        from accounts.models import User, Profile
        from community.models import Event
        from sightings.models import MarineSighting
        from ocean_sounds.models import OceanSound
        from locations.models import Village, District, Zone

        total_contributions = Contribution.objects.filter(created_at__gte=start, created_at__lt=end).count()
        verified_contributions = Contribution.objects.filter(created_at__gte=start, created_at__lt=end, status='verified').count()

        total_users = User.objects.filter(date_joined__gte=start, date_joined__lt=end).count()
        active_users = Profile.objects.filter(
            last_active_at__gte=start, last_active_at__lt=end
        ).count()

        total_villages = Village.objects.filter(
            contribution__created_at__gte=start,
            contribution__created_at__lt=end,
        ).distinct().count()

        total_districts = District.objects.filter(
            villages__contribution__created_at__gte=start,
            villages__contribution__created_at__lt=end,
        ).distinct().count()

        total_zones = Zone.objects.filter(
            districts__villages__contribution__created_at__gte=start,
            districts__villages__contribution__created_at__lt=end,
        ).distinct().count()

        total_events = Event.objects.filter(start_date__gte=start, start_date__lt=end).count()
        total_sightings = MarineSighting.objects.filter(created_at__gte=start, created_at__lt=end).count()
        total_sounds = OceanSound.objects.filter(created_at__gte=start, created_at__lt=end).count()

        beach_cleanups = Event.objects.filter(
            start_date__gte=start, start_date__lt=end, event_type='cleanup'
        ).count()

        total_points = Contribution.objects.filter(
            created_at__gte=start, created_at__lt=end
        ).aggregate(total=Sum('points'))['total'] or 0

        monthly_data = {}
        for m in range(1, 13):
            m_start = dt(year, m, 1, tzinfo=dt_timezone.utc)
            if m == 12:
                m_end = dt(year + 1, 1, 1, tzinfo=dt_timezone.utc)
            else:
                m_end = dt(year, m + 1, 1, tzinfo=dt_timezone.utc)

            m_contributions = Contribution.objects.filter(created_at__gte=m_start, created_at__lt=m_end).count()
            m_verified = Contribution.objects.filter(created_at__gte=m_start, created_at__lt=m_end, status='verified').count()
            m_users = User.objects.filter(date_joined__gte=m_start, date_joined__lt=m_end).count()
            m_sightings = MarineSighting.objects.filter(created_at__gte=m_start, created_at__lt=m_end).count()
            m_sounds = OceanSound.objects.filter(created_at__gte=m_start, created_at__lt=m_end).count()
            m_events = Event.objects.filter(start_date__gte=m_start, start_date__lt=m_end).count()
            m_points = Contribution.objects.filter(created_at__gte=m_start, created_at__lt=m_end).aggregate(t=Sum('points'))['t'] or 0
            m_villages = Village.objects.filter(contribution__created_at__gte=m_start, contribution__created_at__lt=m_end).distinct().count()

            monthly_data[str(m)] = {
                'contributions': m_contributions,
                'verified': m_verified,
                'new_users': m_users,
                'sightings': m_sightings,
                'sounds': m_sounds,
                'events': m_events,
                'points': m_points,
                'villages_active': m_villages,
            }

        variance_analysis = self._analyze_variance(year, monthly_data)

        report, created = AnnualReport.objects.update_or_create(
            year=year,
            defaults={
                'total_contributions': total_contributions,
                'verified_contributions': verified_contributions,
                'total_users': total_users,
                'active_users': active_users,
                'total_villages': total_villages,
                'total_districts': total_districts,
                'total_zones': total_zones,
                'total_events': total_events,
                'total_sightings': total_sightings,
                'total_sounds': total_sounds,
                'beach_cleanups': beach_cleanups,
                'total_points_awarded': total_points,
                'monthly_data': monthly_data,
                'variance_analysis': variance_analysis,
            }
        )

        return Response({
            'message': f'Annual report for {year} generated.',
            'report': AnnualReportSerializer(report).data,
            'created': created,
        })

    def _analyze_variance(self, year, monthly_data):
        months = [int(k) for k in monthly_data.keys()]
        contributions = [monthly_data[str(m)]['contributions'] for m in months]

        if not contributions or sum(contributions) == 0:
            return {'factors': [], 'peak_month': None, 'low_month': None}

        peak_idx = contributions.index(max(contributions))
        low_idx = contributions.index(min(contributions))

        factors = []
        seasonal_map = {
            1: ('northeast_monsoon', 'NE Monsoon season'),
            2: ('post_monsoon', 'Post-monsoon recovery'),
            3: ('summer', 'Summer - fishing active'),
            4: ('summer', 'Summer - peak fishing'),
            5: ('summer', 'Summer - fish spawning'),
            6: ('southwest_monsoon', 'SW Monsoon begins'),
            7: ('southwest_monsoon', 'SW Monsoon - rough seas'),
            8: ('southwest_monsoon', 'SW Monsoon - reduced activity'),
            9: ('post_monsoon', 'Post-monsoon transition'),
            10: ('northeast_monsoon', 'NE Monsoon begins'),
            11: ('northeast_monsoon', 'NE Monsoon - heavy rain'),
            12: ('northeast_monsoon', 'NE Monsoon - reduced activity'),
        }

        weather_factors = {
            'northeast_monsoon': 'Reduced contributions due to rough seas and heavy rainfall. Fishing activity decreases.',
            'southwest_monsoon': 'Coastal areas affected by monsoon. Limited marine observation opportunities.',
            'summer': 'Peak fishing and marine observation season. Higher activity and contributions.',
            'post_monsoon': 'Transitional period. Moderate activity as conditions stabilize.',
        }

        festival_months = {
            1: ['Pongal', 'New Year'],
            4: ['Tamil New Year'],
            8: ['Independence Day'],
            10: ['Dasara'],
            11: ['Diwali'],
            12: ['Christmas'],
        }

        for m in months:
            season, description = seasonal_map.get(m, ('unknown', 'Unknown'))
            if season not in [f['season'] for f in factors]:
                factors.append({
                    'season': season,
                    'description': weather_factors.get(season, ''),
                    'months_affected': [],
                })
            for f in factors:
                if f['season'] == season:
                    f['months_affected'].append(m)

            if m in festival_months:
                factors.append({
                    'type': 'festival',
                    'month': m,
                    'festivals': festival_months[m],
                    'impact': 'Community gatherings may increase participation.',
                })

        low_months = [6, 7, 8, 11, 12]
        for m in low_months:
            if monthly_data.get(str(m), {}).get('contributions', 0) < sum(contributions) / 12 * 0.5:
                factors.append({
                    'type': 'weather_impact',
                    'month': m,
                    'description': f'Month {m} shows below-average contributions, likely due to weather conditions.',
                })

        return {
            'factors': factors,
            'peak_month': months[peak_idx] + 1,
            'low_month': months[low_idx] + 1,
            'peak_contributions': max(contributions),
            'low_contributions': min(contributions),
            'average_monthly': round(sum(contributions) / len(contributions), 1),
            'summary': 'Contributions vary primarily due to monsoon seasons, fishing patterns, and festival periods. '
                       'Summer months (March-May) show highest activity. '
                       'Monsoon months (June-August, October-December) show reduced contributions '
                       'due to rough seas and heavy rainfall.',
        }


class MonthlyTrendListView(generics.ListAPIView):
    serializer_class = MonthlyTrendSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['year']
    ordering_fields = ['year', 'month']
    queryset = MonthlyTrend.objects.all()


class YearComparisonView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        year = int(request.query_params.get('year', timezone.now().year - 1))
        reports = AnnualReport.objects.filter(year__gte=year - 5, year__lte=year).order_by('year')

        data = []
        prev = None
        for report in reports:
            change_c = 0
            change_u = 0
            if prev:
                if prev.total_contributions > 0:
                    change_c = ((report.total_contributions - prev.total_contributions) / prev.total_contributions) * 100
                if prev.total_users > 0:
                    change_u = ((report.total_users - prev.total_users) / prev.total_users) * 100

            data.append({
                'year': report.year,
                'total_contributions': report.total_contributions,
                'verified_contributions': report.verified_contributions,
                'total_users': report.total_users,
                'active_users': report.active_users,
                'total_sightings': report.total_sightings,
                'total_sounds': report.total_sounds,
                'total_events': report.total_events,
                'change_percent_contributions': round(change_c, 1),
                'change_percent_users': round(change_u, 1),
            })
            prev = report

        return Response(data)


class ContributionVarianceView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        year = int(request.query_params.get('year', timezone.now().year - 1))
        try:
            report = AnnualReport.objects.get(year=year)
        except AnnualReport.DoesNotExist:
            return Response({'error': f'No report for {year}. Generate it first.'}, status=404)

        return Response({
            'year': year,
            'variance_analysis': report.variance_analysis,
            'monthly_data': report.monthly_data,
        })
