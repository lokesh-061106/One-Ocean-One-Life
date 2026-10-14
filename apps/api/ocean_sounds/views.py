from rest_framework import generics, permissions
from .models import OceanSound, SoundCategory, SoundItem
from .serializers import (
    OceanSoundListSerializer,
    OceanSoundDetailSerializer,
    OceanSoundCreateSerializer,
    SoundCategorySerializer,
    SoundItemSerializer,
)


class OceanSoundListView(generics.ListAPIView):
    serializer_class = OceanSoundListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['instrument', 'contribution__status', 'contribution__village']
    search_fields = ['instrument', 'manufacturer', 'written_description']
    ordering_fields = ['created_at', 'duration_seconds']
    queryset = OceanSound.objects.select_related(
        'contribution__user__profile__village__district__zone',
        'contribution__village__district__zone',
        'contribution__zone',
    ).all()


class OceanSoundDetailView(generics.RetrieveAPIView):
    serializer_class = OceanSoundDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = OceanSound.objects.select_related(
        'contribution__user__profile__village__district__zone',
        'contribution__village__district__zone',
        'contribution__zone',
    ).all()


class OceanSoundCreateView(generics.CreateAPIView):
    serializer_class = OceanSoundCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


def _descendant_category_ids(category):
    """The category plus every category below it (group level)."""
    ids = [category.id]
    for child in category.children.all():
        ids.extend(_descendant_category_ids(child))
    return ids


class SoundLibraryCategoryListView(generics.ListAPIView):
    """Nested tree of the curated Ocean Sound Library (3 top categories)."""

    serializer_class = SoundCategorySerializer
    permission_classes = [permissions.AllowAny]
    search_fields = ['name', 'description']
    ordering_fields = ['sort_order', 'name']
    queryset = SoundCategory.objects.filter(parent__isnull=True).prefetch_related(
        'items', 'children__items',
    )


class SoundLibraryItemListView(generics.ListAPIView):
    """All curated sounds. Optional `?category=<slug>` includes sub-categories."""

    serializer_class = SoundItemSerializer
    permission_classes = [permissions.AllowAny]
    search_fields = ['name', 'description', 'source']
    ordering_fields = ['name', 'sort_order', 'created_at']
    queryset = SoundItem.objects.select_related('category').all()

    def get_queryset(self):
        queryset = super().get_queryset()
        slug = self.request.query_params.get('category') or self.request.query_params.get('group')
        if not slug:
            return queryset
        root = SoundCategory.objects.filter(slug=slug).first()
        if root is None:
            return queryset.none()
        return queryset.filter(category_id__in=_descendant_category_ids(root))


class SoundLibraryItemDetailView(generics.RetrieveAPIView):
    serializer_class = SoundItemSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    queryset = SoundItem.objects.select_related('category').all()
