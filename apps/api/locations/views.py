from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count
from .models import Zone, District, Village, StateFisheriesProfile
from .serializers import (
    ZoneSerializer,
    ZoneDetailSerializer,
    DistrictSerializer,
    VillageSerializer,
    StateFisheriesProfileSerializer,
)


class ZoneListView(generics.ListAPIView):
    serializer_class = ZoneSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Zone.objects.all()


class ZoneDetailView(generics.RetrieveAPIView):
    serializer_class = ZoneDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Zone.objects.all()
    lookup_field = 'slug'


class StateListView(APIView):
    """Distinct state names derived from District.state (there is no states table)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        states = list(
            District.objects.exclude(state='')
            .values_list('state', flat=True)
            .distinct()
            .order_by('state')
        )
        return Response([{'name': s} for s in states])


class DistrictListView(generics.ListAPIView):
    serializer_class = DistrictSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['zone']
    search_fields = ['name']
    queryset = District.objects.select_related('zone').all()

    def get_queryset(self):
        qs = super().get_queryset()
        state = self.request.query_params.get('state')
        if state:
            qs = qs.filter(state__iexact=state)
        return qs


class VillageListView(generics.ListAPIView):
    serializer_class = VillageSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['district', 'district__zone', 'is_coastal']
    search_fields = ['name']
    queryset = Village.objects.select_related('district__zone').all()

    def get_queryset(self):
        qs = super().get_queryset()
        state = self.request.query_params.get('state')
        if state:
            qs = qs.filter(district__state__iexact=state)
        return qs


class VillageDetailView(generics.RetrieveAPIView):
    serializer_class = VillageSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Village.objects.select_related('district__zone').all()


class StateProfileListView(generics.ListAPIView):
    serializer_class = StateFisheriesProfileSerializer
    permission_classes = [permissions.AllowAny]
    queryset = StateFisheriesProfile.objects.prefetch_related('lean_periods').all()

    def get_queryset(self):
        qs = super().get_queryset()
        state = self.request.query_params.get('state')
        if state:
            qs = qs.filter(state__iexact=state)
        return qs


class StateProfileDetailView(generics.RetrieveAPIView):
    serializer_class = StateFisheriesProfileSerializer
    permission_classes = [permissions.AllowAny]
    queryset = StateFisheriesProfile.objects.prefetch_related('lean_periods').all()
    lookup_field = 'slug'
