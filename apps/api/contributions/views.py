from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.db.models import Sum, Count
from django.utils import timezone
from core.permissions import IsModerator
from .models import Contribution, ContributionType
from .schemas import build_wizard_config
from .serializers import (
    ContributionTypeSerializer,
    ContributionListSerializer,
    ContributionDetailSerializer,
    ContributionCreateSerializer,
    ContributionUpdateSerializer,
    ContributionReviewSerializer,
    PublicContributionSerializer,
)
from .scoring import calculate_contribution_points
from .publishing import publish_contribution, unpublish_contribution
from .verification import STATUS_TRANSITIONS, can_transition


class ContributionTypeListView(generics.ListAPIView):
    serializer_class = ContributionTypeSerializer
    permission_classes = [permissions.AllowAny]
    queryset = ContributionType.objects.filter(is_active=True)


class ContributionWizardConfigView(APIView):
    """Field/media definition for the submission wizard (web + mobile)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(build_wizard_config())


class ContributionListView(generics.ListAPIView):
    serializer_class = ContributionListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['type', 'status', 'village', 'contributor_type']
    search_fields = ['title', 'author', 'notes']
    ordering_fields = ['created_at', 'points', 'quality_score']

    def get_queryset(self):
        return Contribution.objects.select_related('user', 'village', 'zone').prefetch_related('media').filter(user=self.request.user)


class ContributionMyStatsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Contribution.objects.filter(user=request.user)
        stats = qs.aggregate(
            total=Count('id'),
            verified=Count('id', filter=models.Q(status='verified')),
            total_points=Sum('points'),
        )
        by_type = qs.values('type').annotate(count=Count('id'), points=Sum('points'))
        return Response({
            'total': stats['total'],
            'verified': stats['verified'],
            'total_points': stats['total_points'] or 0,
            'by_type': list(by_type),
        })


class ContributionDetailView(generics.RetrieveAPIView):
    serializer_class = ContributionDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Contribution.objects.select_related('user', 'village', 'zone').prefetch_related('media').all()

    def get_object(self):
        obj = super().get_object()
        if obj.user != self.request.user and not (
            self.request.user.is_authenticated
            and (
                self.request.user.is_superuser
                or self.request.user.role in ['MODERATOR', 'SCIENTIFIC_VALIDATOR', 'ADMIN', 'SUPER_ADMIN']
            )
        ):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have access to this contribution.')
        return obj


class ContributionCreateView(generics.CreateAPIView):
    serializer_class = ContributionCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class ContributionPublicListView(generics.ListAPIView):
    """Approved contributions visible to everyone."""
    serializer_class = PublicContributionSerializer
    permission_classes = [permissions.AllowAny]
    search_fields = ['title', 'author', 'notes']
    ordering_fields = ['verified_at', 'created_at', 'points']

    def get_queryset(self):
        qs = Contribution.objects.select_related('user', 'village').prefetch_related('media').filter(
            status='verified',
            visibility_status__in=['COMMUNITY_VISIBLE', 'MARKETPLACE_VISIBLE'],
        )
        type_param = self.request.query_params.get('type')
        if type_param:
            qs = qs.filter(type=type_param)
        village = self.request.query_params.get('village')
        if village:
            qs = qs.filter(village_id=village)
        return qs


class ContributionPublicDetailView(generics.RetrieveAPIView):
    serializer_class = PublicContributionSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Contribution.objects.select_related('user', 'village').prefetch_related('media').filter(
        status='verified',
        visibility_status__in=['COMMUNITY_VISIBLE', 'MARKETPLACE_VISIBLE'],
    )
    lookup_field = 'slug'
    lookup_url_kwarg = 'lookup'

    def get_object(self):
        """Resolve the lookup value as either a slug or the raw UUID id."""
        import uuid as uuid_mod
        from django.http import Http404

        lookup = self.kwargs.get(self.lookup_url_kwarg) or self.kwargs.get('pk')
        qs = self.filter_queryset(self.get_queryset())
        try:
            pk = uuid_mod.UUID(str(lookup))
        except (ValueError, TypeError, AttributeError):
            pk = None
        if pk is not None:
            obj = qs.filter(pk=pk).first()
            if obj is not None:
                return obj
        obj = qs.filter(slug=lookup).first()
        if obj is None:
            raise Http404('No contribution found matching the lookup.')
        self.kwargs[self.lookup_field] = obj.slug
        return obj


class ContributionAdminListView(generics.ListAPIView):
    serializer_class = ContributionListSerializer
    permission_classes = [IsModerator]
    filterset_fields = ['type', 'status', 'village', 'safety_status', 'moderation_decision', 'contributor_type']
    search_fields = ['title', 'author', 'notes', 'user__username']
    ordering_fields = ['created_at', 'points', 'quality_score', 'submitted_at']

    def get_queryset(self):
        qs = Contribution.objects.select_related('user', 'village', 'zone').prefetch_related('media').all()
        pending = self.request.query_params.get('pending')
        if pending in ('1', 'true', 'True'):
            qs = qs.filter(status__in=['submitted', 'auto_validated', 'moderator_review', 'scientific_review'])
        return qs


class ContributionUpdateView(generics.UpdateAPIView):
    serializer_class = ContributionUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = Contribution.objects.select_related('user', 'village', 'zone').prefetch_related('media').all()

    def get_object(self):
        obj = super().get_object()
        if obj.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only the owner may edit this contribution.')
        return obj


class ContributionDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Contribution.objects.all()

    def get_object(self):
        obj = super().get_object()
        if obj.user != self.request.user and not (
            self.request.user.is_superuser
            or self.request.user.role in ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']
        ):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to delete this contribution.')
        return obj


class ContributionReviewView(APIView):
    """Approve / reject a contribution (moderator & up)."""

    permission_classes = [permissions.IsAuthenticated]

    # Canonical state machine lives in verification.STATUS_TRANSITIONS —
    # imported through can_transition() so there is a single source of truth.
    VALID_TRANSITIONS = None

    REVIEWER_ROLES = ['MODERATOR', 'SCIENTIFIC_VALIDATOR', 'ADMIN', 'SUPER_ADMIN']

    def post(self, request, pk):
        try:
            contribution = Contribution.objects.prefetch_related('media').get(pk=pk)
        except Contribution.DoesNotExist:
            return Response({'error': 'Contribution not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ContributionReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        action = data.get('action')
        target_status = data.get('status')
        notes = data.get('notes', '')
        rejection_reason = data.get('rejection_reason', '')

        is_reviewer = (
            request.user.is_superuser
            or request.user.role in self.REVIEWER_ROLES
        )
        if action in ('review', 'verify', 'approve', 'reject') or target_status in ('verified', 'rejected'):
            if not is_reviewer:
                return Response({'error': 'Insufficient permissions.'}, status=status.HTTP_403_FORBIDDEN)

        if action == 'validate':
            target_status = 'auto_validated'
        elif action == 'review':
            target_status = 'moderator_review'
        elif action in ('verify', 'approve'):
            target_status = 'verified'
        elif action == 'reject':
            target_status = 'rejected'

        if not target_status:
            return Response({'error': 'action or status is required.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed = STATUS_TRANSITIONS.get(contribution.status, [])
        if not can_transition(contribution.status, target_status):
            return Response(
                {'error': f'Cannot transition from {contribution.status} to {target_status}. Allowed: {allowed}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from_status = contribution.status
        if data.get('quality_score') is not None:
            contribution.quality_score = float(data['quality_score'])
        if notes and target_status not in ('verified', 'rejected'):
            contribution.notes = notes

        contribution.reviewer = request.user
        contribution.reviewed_at = timezone.now()

        if target_status == 'verified':
            contribution.status = 'verified'
            contribution.verified_at = timezone.now()
            contribution.verified_by = request.user
            contribution.submitted_at = contribution.submitted_at or timezone.now()
            contribution.moderation_decision = 'APPROVED'
            contribution.visibility_status = 'COMMUNITY_VISIBLE'
            if data.get('points') is not None:
                contribution.points = int(data['points'])
            else:
                contribution.points = calculate_contribution_points(contribution.type, 'verified')
            contribution.save()
            child_records = publish_contribution(contribution)
        elif target_status == 'rejected':
            unpublish_contribution(contribution, reason=rejection_reason or notes)
            child_records = []
        else:
            contribution.status = target_status
            contribution.submitted_at = contribution.submitted_at or timezone.now()
            if target_status in ('submitted', 'auto_validated', 'moderator_review'):
                contribution.moderation_decision = 'HUMAN_REVIEW' if target_status != 'auto_validated' else 'SAFE_AUTO_PASS'
                contribution.visibility_status = 'UNDER_REVIEW'
            if data.get('points') is not None:
                contribution.points = int(data['points'])
            else:
                contribution.points = calculate_contribution_points(contribution.type, target_status)
            contribution.save()
            child_records = []

        if from_status != contribution.status:
            from .models import VerificationHistory
            VerificationHistory.objects.create(
                contribution=contribution,
                action=f'review:{action or "status"}',
                from_status=from_status,
                to_status=contribution.status,
                reviewer=request.user,
                notes=rejection_reason or notes,
            )

        try:
            from .tasks import update_user_score_task
            update_user_score_task.delay(str(contribution.user_id))
        except Exception:
            pass

        return Response({
            'id': str(contribution.id),
            'status': contribution.status,
            'quality_score': contribution.quality_score,
            'points': contribution.points,
            'visibility_status': contribution.visibility_status,
            'moderation_decision': contribution.moderation_decision,
            'child_records': [str(getattr(c, 'id', '')) for c in child_records],
            'message': f'Contribution updated to {contribution.status}.',
        })
