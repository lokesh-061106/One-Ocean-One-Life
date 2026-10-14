from rest_framework import generics, permissions
from .models import BusinessIdea, GovernmentScheme, Workshop, ShgSection, RevenueItem, LoanScheme, FishProduct, Recipe
from .serializers import (
    BusinessIdeaListSerializer, BusinessIdeaDetailSerializer, BusinessIdeaCreateUpdateSerializer,
    GovernmentSchemeListSerializer, GovernmentSchemeDetailSerializer, GovernmentSchemeCreateUpdateSerializer,
    WorkshopListSerializer, WorkshopDetailSerializer, WorkshopCreateUpdateSerializer,
    ShgSectionSerializer, RevenueItemSerializer, LoanSchemeSerializer,
    FishProductSerializer, RecipeSerializer,
)


class BusinessIdeaListView(generics.ListAPIView):
    serializer_class = BusinessIdeaListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['investment_level', 'is_active']
    search_fields = ['title', 'description', 'problem']
    ordering_fields = ['created_at', 'investment_min']
    queryset = BusinessIdea.objects.filter(is_active=True)


class BusinessIdeaDetailView(generics.RetrieveAPIView):
    serializer_class = BusinessIdeaDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = BusinessIdea.objects.all()


class BusinessIdeaCreateView(generics.CreateAPIView):
    serializer_class = BusinessIdeaCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = BusinessIdea.objects.all()


class BusinessIdeaUpdateView(generics.UpdateAPIView):
    serializer_class = BusinessIdeaCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = BusinessIdea.objects.all()


class BusinessIdeaDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = BusinessIdea.objects.all()


class GovernmentSchemeListView(generics.ListAPIView):
    serializer_class = GovernmentSchemeListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['eligibility_occupation', 'state', 'district', 'is_active']
    search_fields = ['scheme_name', 'authority', 'description']
    ordering_fields = ['scheme_name', 'deadline']
    queryset = GovernmentScheme.objects.filter(is_active=True)


class GovernmentSchemeDetailView(generics.RetrieveAPIView):
    serializer_class = GovernmentSchemeDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = GovernmentScheme.objects.all()


class GovernmentSchemeCreateView(generics.CreateAPIView):
    serializer_class = GovernmentSchemeCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = GovernmentScheme.objects.all()


class GovernmentSchemeUpdateView(generics.UpdateAPIView):
    serializer_class = GovernmentSchemeCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = GovernmentScheme.objects.all()


class GovernmentSchemeDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = GovernmentScheme.objects.all()


class WorkshopListView(generics.ListAPIView):
    serializer_class = WorkshopListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['is_free', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['date', 'fee']
    queryset = Workshop.objects.filter(is_active=True)


class WorkshopDetailView(generics.RetrieveAPIView):
    serializer_class = WorkshopDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Workshop.objects.all()


class WorkshopCreateView(generics.CreateAPIView):
    serializer_class = WorkshopCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Workshop.objects.all()


class WorkshopUpdateView(generics.UpdateAPIView):
    serializer_class = WorkshopCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Workshop.objects.all()


class WorkshopDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Workshop.objects.all()


# ---------------------------------------------------------------------------
# Fisherwomen SHG handbook — read-only content endpoints
# ---------------------------------------------------------------------------

class ShgSectionListView(generics.ListAPIView):
    serializer_class = ShgSectionSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['is_published', 'tone']
    ordering_fields = ['sort_order', 'num']
    queryset = ShgSection.objects.filter(is_published=True)


class ShgSectionDetailView(generics.RetrieveAPIView):
    serializer_class = ShgSectionSerializer
    permission_classes = [permissions.AllowAny]
    queryset = ShgSection.objects.all()
    lookup_field = 'key'


class RevenueItemListView(generics.ListAPIView):
    serializer_class = RevenueItemSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['section__key', 'is_active']
    ordering_fields = ['sort_order', 'activity']
    queryset = RevenueItem.objects.filter(is_active=True)


class RevenueItemDetailView(generics.RetrieveAPIView):
    serializer_class = RevenueItemSerializer
    permission_classes = [permissions.AllowAny]
    queryset = RevenueItem.objects.all()


class LoanSchemeListView(generics.ListAPIView):
    serializer_class = LoanSchemeSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['is_active']
    ordering_fields = ['sort_order', 'name']
    queryset = LoanScheme.objects.filter(is_active=True)


class LoanSchemeDetailView(generics.RetrieveAPIView):
    serializer_class = LoanSchemeSerializer
    permission_classes = [permissions.AllowAny]
    queryset = LoanScheme.objects.all()


class FishProductListView(generics.ListAPIView):
    serializer_class = FishProductSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['is_active']
    ordering_fields = ['sort_order', 'english']
    queryset = FishProduct.objects.filter(is_active=True)


class FishProductDetailView(generics.RetrieveAPIView):
    serializer_class = FishProductSerializer
    permission_classes = [permissions.AllowAny]
    queryset = FishProduct.objects.all()


class RecipeListView(generics.ListAPIView):
    serializer_class = RecipeSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['is_active']
    search_fields = ['fish', 'dish', 'ingredients']
    ordering_fields = ['sort_order', 'fish']
    queryset = Recipe.objects.filter(is_active=True)


class RecipeDetailView(generics.RetrieveAPIView):
    serializer_class = RecipeSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Recipe.objects.all()
