import json
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.http import HttpResponse
from core.models_security import AuditLog, UserConsent, DataExportRequest


class AccountDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        AuditLog.objects.create(
            user=user,
            action='delete',
            resource_type='account',
            resource_id=str(user.id),
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={'reason': request.data.get('reason', '')},
        )

        user.is_active = False
        user.username = f"deleted_{user.id}"
        user.email = ""
        user.first_name = ""
        user.last_name = ""
        user.phone = ""
        user.save()

        from accounts.models import Profile
        Profile.objects.filter(user=user).update(
            bio='', occupation='', organization='', photo=None,
            latitude=None, longitude=None,
        )

        return Response({'message': 'Account deleted successfully.'})

    def _get_client_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class DataExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        export_request = DataExportRequest.objects.create(
            user=request.user,
            status='processing',
        )

        user = request.user
        data = {
            'profile': {},
            'contributions': [],
            'sightings': [],
            'sounds': [],
            'events': [],
            'orders': [],
            'exported_at': timezone.now().isoformat(),
        }

        from accounts.models import Profile
        try:
            profile = Profile.objects.get(user=user)
            data['profile'] = {
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'village': str(profile.village) if profile.village else None,
                'occupation': profile.occupation,
                'organization': profile.organization,
                'contribution_score': profile.contribution_score,
                'member_status': profile.member_status,
                'date_joined': user.date_joined.isoformat(),
            }
        except Profile.DoesNotExist:
            pass

        from contributions.models import Contribution
        for c in Contribution.objects.filter(user=user):
            data['contributions'].append({
                'id': str(c.id),
                'type': c.type,
                'status': c.status,
                'quality_score': c.quality_score,
                'points': c.points,
                'created_at': c.created_at.isoformat(),
            })

        from sightings.models import MarineSighting
        for s in MarineSighting.objects.filter(contribution__user=user):
            data['sightings'].append({
                'id': str(s.id),
                'species': str(s.species) if s.species else s.ai_species_suggestion,
                'number_observed': s.number_observed,
                'behavior': s.behavior,
                'sighting_date': str(s.sighting_date) if s.sighting_date else None,
                'created_at': s.created_at.isoformat(),
            })

        from ocean_sounds.models import OceanSound
        for s in OceanSound.objects.filter(contribution__user=user):
            data['sounds'].append({
                'id': str(s.id),
                'instrument': s.instrument,
                'recording_date': str(s.recording_date) if s.recording_date else None,
                'created_at': s.created_at.isoformat(),
            })

        from community.models import EventParticipant
        for ep in EventParticipant.objects.filter(user=user).select_related('event'):
            data['events'].append({
                'event_title': ep.event.title,
                'event_type': ep.event.event_type,
                'status': ep.status,
                'date': ep.event.start_date.isoformat(),
            })

        from marketplace.models import Order
        for o in Order.objects.filter(buyer=user):
            data['orders'].append({
                'order_number': o.order_number,
                'total': str(o.total),
                'status': o.status,
                'created_at': o.created_at.isoformat(),
            })

        export_request.status = 'completed'
        export_request.save()

        response = HttpResponse(
            json.dumps(data, indent=2, default=str),
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="o3l_data_export_{user.username}.json"'
        return response


class ConsentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        consents = UserConsent.objects.filter(user=request.user)
        return Response({
            'consents': {
                c.consent_type: c.granted
                for c in consents
            }
        })

    def post(self, request):
        consent_type = request.data.get('consent_type')
        granted = request.data.get('granted', False)

        if not consent_type:
            return Response(
                {'error': 'consent_type is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_types = [c[0] for c in UserConsent.CONSENT_TYPES]
        if consent_type not in valid_types:
            return Response(
                {'error': f'Invalid consent_type. Valid: {valid_types}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        consent, created = UserConsent.objects.update_or_create(
            user=request.user,
            consent_type=consent_type,
            defaults={
                'granted': granted,
                'ip_address': self._get_client_ip(request),
            }
        )

        AuditLog.objects.create(
            user=request.user,
            action='update',
            resource_type='consent',
            resource_id=str(consent.id),
            ip_address=self._get_client_ip(request),
            details={'consent_type': consent_type, 'granted': granted},
        )

        return Response({
            'consent_type': consent_type,
            'granted': consent.granted,
            'updated_at': consent.updated_at.isoformat(),
        })

    def _get_client_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class AuditLogListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['action', 'resource_type']
    ordering_fields = ['created_at']

    def get_queryset(self):
        if self.request.user.role in ['ADMIN', 'SUPER_ADMIN']:
            return AuditLog.objects.select_related('user').all()
        return AuditLog.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())[:100]
        data = []
        for log in queryset:
            data.append({
                'id': str(log.id),
                'user': log.user.username if log.user else None,
                'action': log.action,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id,
                'ip_address': log.ip_address,
                'details': log.details,
                'created_at': log.created_at.isoformat(),
            })
        return Response(data)
