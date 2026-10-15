from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from core.permissions import IsAdmin
from .models import Page, SiteHeaderConfig, MenuItem
from .serializers import (
    PageListSerializer,
    PageDetailSerializer,
    HeaderMenuSerializer,
    MenuItemSerializer,
    MenuItemBulkSerializer,
)


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


class MenuItemListCreateView(APIView):
    """Public read / admin create for storefront menu items."""

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get(self, request):
        serializer = MenuItemSerializer(MenuItem.objects.all(), many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MenuItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MenuItemDetailView(APIView):
    """Admin write / public read for a single menu item."""

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get_object(self, pk):
        try:
            return MenuItem.objects.get(pk=pk)
        except MenuItem.DoesNotExist:
            return None

    def get(self, request, pk):
        item = self.get_object(pk)
        if item is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(MenuItemSerializer(item).data)

    def put(self, request, pk):
        return self._save(request, pk, partial=False)

    def patch(self, request, pk):
        return self._save(request, pk, partial=True)

    def delete(self, request, pk):
        item = self.get_object(pk)
        if item is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _save(self, request, pk, partial):
        item = self.get_object(pk)
        if item is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MenuItemSerializer(item, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MenuItemBulkUpdateView(APIView):
    """Single admin save: apply visibility + ordering for many items at once."""

    permission_classes = [IsAdmin]

    def put(self, request):
        serializer = MenuItemBulkSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            for row in serializer.validated_data:
                fields = {k: v for k, v in row.items() if k != "id"}
                MenuItem.objects.filter(pk=row["id"]).update(**fields)
        return Response(MenuItemSerializer(MenuItem.objects.all(), many=True).data)
