from django.core.exceptions import ValidationError
from django.http import Http404
from rest_framework import generics, permissions

from .models import Observation
from .serializers import ObservationListSerializer, ObservationDetailSerializer


class ObservationListView(generics.ListAPIView):
    """Public gallery of approved observations.

    Rows only exist after ``publish_contribution()``, but the status filter is
    kept as a belt-and-braces guard so a half-withdrawn row can never leak.
    """

    serializer_class = ObservationListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['observation_category', 'contribution__status', 'contribution__village']
    search_fields = ['organism_name', 'contribution__title', 'contribution__notes']
    ordering_fields = ['created_at']
    queryset = (
        Observation.objects
        .select_related('contribution__user', 'contribution__village')
        .filter(contribution__status='verified')
    )


class ObservationDetailView(generics.RetrieveAPIView):
    serializer_class = ObservationDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = (
        Observation.objects
        .select_related('contribution__user', 'contribution__village', 'contribution__zone')
        .filter(contribution__status='verified')
    )

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_field or 'pk')
        qs = self.filter_queryset(self.get_queryset())
        obj = qs.filter(slug=lookup).first()
        if obj is not None:
            return obj
        try:
            return qs.get(pk=lookup)
        except (Observation.DoesNotExist, ValidationError, ValueError, TypeError):
            raise Http404(f'No Observation found matching {lookup!r}')
