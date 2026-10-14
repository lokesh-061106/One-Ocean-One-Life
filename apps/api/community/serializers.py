from rest_framework import serializers
from .models import Event, EventParticipant, EventDiary, CommunityPost


class EventListSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.username', read_only=True)
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    participant_count = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'slug', 'description', 'event_type', 'type_display', 'organizer', 'organizer_name',
            'village', 'village_name', 'location_name', 'start_date', 'end_date', 'max_participants',
            'is_published', 'photo', 'participant_count', 'created_at'
        ]

    def get_participant_count(self, obj):
        return obj.participants.filter(status__in=['registered', 'attended']).count()


class EventDetailSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.username', read_only=True)
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    participants = serializers.SerializerMethodField()
    diary = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'

    def get_participants(self, obj):
        participants = obj.participants.select_related('user').filter(status__in=['registered', 'attended'])
        return [{'user': p.user.username, 'status': p.status} for p in participants]

    def get_diary(self, obj):
        if hasattr(obj, 'diary'):
            return {
                'summary': obj.diary.summary,
                'photos_count': obj.diary.photos_count,
                'videos_count': obj.diary.videos_count,
                'participants_count': obj.diary.participants_count,
            }
        return None


class EventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['title', 'description', 'event_type', 'location', 'location_name', 'village', 'start_date', 'end_date', 'max_participants']

    def create(self, validated_data):
        validated_data['organizer'] = self.context['request'].user
        validated_data['is_published'] = True
        return super().create(validated_data)


class CommunityPostListSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)

    class Meta:
        model = CommunityPost
        fields = ['id', 'title', 'category', 'author', 'author_name', 'village', 'village_name', 'is_verified', 'reactions_count', 'created_at']


class CommunityPostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityPost
        fields = ['title', 'content', 'category', 'village', 'image']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class CommunityPostUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityPost
        fields = ['title', 'content', 'category', 'village', 'image', 'is_verified']


class EventUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['title', 'description', 'event_type', 'location', 'location_name', 'village', 'start_date', 'end_date', 'max_participants', 'is_published']
