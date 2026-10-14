import uuid as uuid_lib

from django.http import Http404
from rest_framework import generics, permissions
from .models import EducationCategory, EducationPost
from .serializers import EducationCategorySerializer, EducationPostListSerializer, EducationPostDetailSerializer, EducationPostCreateSerializer


class EducationCategoryListView(generics.ListAPIView):
    serializer_class = EducationCategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = EducationCategory.objects.all()


class EducationPostListView(generics.ListAPIView):
    serializer_class = EducationPostListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['category', 'post_type', 'is_verified', 'village']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'reactions_count']
    queryset = EducationPost.objects.select_related('author', 'village').prefetch_related('images').all()


class EducationPostDetailView(generics.RetrieveAPIView):
    serializer_class = EducationPostDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = EducationPost.objects.select_related('author', 'village', 'category').prefetch_related('images').all()
    lookup_url_kwarg = 'identifier'

    def get_object(self):
        identifier = str(self.kwargs.get(self.lookup_url_kwarg, ''))
        queryset = self.get_queryset()

        obj = queryset.filter(slug=identifier).first()
        if obj is None:
            try:
                uuid_lib.UUID(identifier)
            except (ValueError, TypeError, AttributeError):
                raise Http404('No education post found matching the query')
            obj = queryset.filter(pk=identifier).first()
        if obj is None:
            raise Http404('No education post found matching the query')
        return obj

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return super().retrieve(request, *args, **kwargs)


class EducationPostCreateView(generics.CreateAPIView):
    serializer_class = EducationPostCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
