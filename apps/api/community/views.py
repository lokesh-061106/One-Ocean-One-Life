import uuid as uuid_lib

from django.http import Http404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Event, EventParticipant, CommunityPost
from .serializers import EventListSerializer, EventDetailSerializer, EventCreateSerializer, CommunityPostListSerializer, CommunityPostCreateSerializer, CommunityPostUpdateSerializer, EventUpdateSerializer


def get_event_or_404(identifier):
    """Resolve an event by slug or UUID (legacy links keep working)."""
    identifier = str(identifier)
    queryset = Event.objects.all()

    obj = queryset.filter(slug=identifier).first()
    if obj is None:
        try:
            uuid_lib.UUID(identifier)
        except (ValueError, TypeError, AttributeError):
            raise Http404("No event found matching the query")
        obj = queryset.filter(pk=identifier).first()
    if obj is None:
        raise Http404("No event found matching the query")
    return obj


class EventListView(generics.ListAPIView):
    serializer_class = EventListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['event_type', 'is_published', 'village']
    search_fields = ['title', 'description']
    ordering_fields = ['start_date', 'created_at']
    queryset = Event.objects.select_related('organizer', 'village').filter(is_published=True)


class EventDetailView(generics.RetrieveAPIView):
    serializer_class = EventDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Event.objects.select_related('organizer', 'village').all()
    lookup_url_kwarg = 'pk'

    def get_object(self):
        # Resolve against published rows only — get_event_or_404() is shared
        # with the owner-facing update/delete views, so the gate lives here.
        identifier = str(self.kwargs.get(self.lookup_url_kwarg, ''))
        qs = self.get_queryset().filter(is_published=True)

        obj = qs.filter(slug=identifier).first()
        if obj is None:
            try:
                uuid_lib.UUID(identifier)
            except (ValueError, TypeError, AttributeError):
                raise Http404("No event found matching the query")
            obj = qs.filter(pk=identifier).first()
        if obj is None:
            raise Http404("No event found matching the query")
        return obj


class EventCreateView(generics.CreateAPIView):
    serializer_class = EventCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


class EventJoinView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        event = get_event_or_404(pk)
        participant, created = EventParticipant.objects.get_or_create(
            event=event,
            user=request.user,
            defaults={'status': 'registered'}
        )
        if not created:
            return Response({'message': 'Already registered.'}, status=status.HTTP_200_OK)
        return Response({'message': 'Registered for event.'}, status=status.HTTP_201_CREATED)


class EventLeaveView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        event = get_event_or_404(pk)
        deleted, _ = EventParticipant.objects.filter(event=event, user=request.user).delete()
        if deleted:
            return Response({'message': 'Unregistered from event.'})
        return Response({'message': 'Not registered.'}, status=status.HTTP_400_BAD_REQUEST)


class CommunityPostListView(generics.ListAPIView):
    serializer_class = CommunityPostListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['category', 'is_verified', 'village']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'reactions_count']
    queryset = CommunityPost.objects.select_related('author', 'village').all()


class CommunityPostCreateView(generics.CreateAPIView):
    serializer_class = CommunityPostCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


class CommunityPostUpdateView(generics.UpdateAPIView):
    serializer_class = CommunityPostUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = CommunityPost.objects.all()


class CommunityPostDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = CommunityPost.objects.all()


class EventUpdateView(generics.UpdateAPIView):
    serializer_class = EventUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Event.objects.all()

    def get_object(self):
        return get_event_or_404(self.kwargs.get('pk', ''))


class EventDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Event.objects.all()

    def get_object(self):
        return get_event_or_404(self.kwargs.get('pk', ''))
