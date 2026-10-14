from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from core.permissions import IsAdmin
from .models import Page, SiteHeaderConfig
from .serializers import PageListSerializer, PageDetailSerializer, HeaderMenuSerializer


class PageListView(generics.ListAPIView):
    serializer_class = PageListSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Page.objects.filter(is_published=True)


class PageDetailView(generics.RetrieveAPIView):
    serializer_class = PageDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    queryset = Page.objects.filter(is_published=True)


class HeaderMenuView(APIView):
    """Public read / admin write config for the storefront header menu."""

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get(self, request):
        serializer = HeaderMenuSerializer(SiteHeaderConfig.get_singleton())
        return Response(serializer.data)

    def put(self, request):
        return self._save(request, partial=False)

    def patch(self, request):
        return self._save(request, partial=True)

    def _save(self, request, partial):
        serializer = HeaderMenuSerializer(SiteHeaderConfig.get_singleton(), data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
