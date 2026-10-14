from django.core.exceptions import ValidationError
from django.http import Http404
from rest_framework import generics, permissions

from .models import FishCatch
from .serializers import FishCatchListSerializer, FishCatchDetailSerializer


class FishCatchListView(generics.ListAPIView):
    """Public gallery of approved fish catches.

    Rows only exist after ``publish_contribution()``, but the status filter is
    kept as a belt-and-braces guard so a half-withdrawn row can never leak.
    """

    serializer_class = FishCatchListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['gear', 'species_group', 'contribution__status', 'contribution__village']
    search_fields = ['species_name', 'gear_other', 'fishing_location_name',
                     'contribution__title', 'contribution__notes']
    ordering_fields = ['created_at', 'number', 'weight']
    queryset = (
        FishCatch.objects
        .select_related('contribution__user', 'contribution__village')
        .filter(contribution__status='verified')
    )


class FishCatchDetailView(generics.RetrieveAPIView):
    serializer_class = FishCatchDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = (
        FishCatch.objects
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
        except (FishCatch.DoesNotExist, ValidationError, ValueError, TypeError):
            raise Http404(f'No FishCatch found matching {lookup!r}')
