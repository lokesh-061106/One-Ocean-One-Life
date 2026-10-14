from rest_framework import serializers
from contributions.serializers import validate_media_file
from .models import OceanSound, SoundCategory, SoundItem


def _profile(obj):
    """Linked accounts.Profile for the contributor, if one exists."""
    return getattr(obj.contribution.user, 'profile', None)


class CitizenFieldsMixin(serializers.Serializer):
    """Citizen/contributor details derived from the linked Contribution.

    Shared by the citizen-recording list and detail payloads so the public
    storefront can show who recorded each sound, where they are from, and
    their contribution standing.
    """

    contributor = serializers.CharField(source='contribution.user.username', read_only=True)
    contributor_name = serializers.SerializerMethodField()
    village_name = serializers.SerializerMethodField()
    district_name = serializers.SerializerMethodField()
    zone_name = serializers.SerializerMethodField()
    status = serializers.CharField(source='contribution.status', read_only=True)
    member_status = serializers.SerializerMethodField()
    contribution_score = serializers.SerializerMethodField()
    points = serializers.IntegerField(source='contribution.points', read_only=True, default=0)
    latitude = serializers.FloatField(source='contribution.location.y', read_only=True, default=None)
    longitude = serializers.FloatField(source='contribution.location.x', read_only=True, default=None)
    audio_url = serializers.SerializerMethodField()

    def get_contributor_name(self, obj):
        user = obj.contribution.user
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.username

    def get_village_name(self, obj):
        village = self._village(obj)
        return village.name if village else None

    def get_district_name(self, obj):
        village = self._village(obj)
        return village.district.name if village else None

    def get_zone_name(self, obj):
        zone = obj.contribution.zone
        if zone is None:
            village = self._village(obj)
            zone = village.district.zone if village else None
        return zone.name if zone else None

    def get_member_status(self, obj):
        profile = _profile(obj)
        return profile.member_status if profile else None

    def get_contribution_score(self, obj):
        profile = _profile(obj)
        return profile.contribution_score if profile else None

    def get_audio_url(self, obj):
        return _absolute_media_url(self, obj.audio_file)

    def _village(self, obj):
        village = obj.contribution.village
        if village is not None:
            return village
        profile = _profile(obj)
        return profile.village if profile else None


class OceanSoundListSerializer(CitizenFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = OceanSound
        fields = [
            'id', 'contributor', 'contributor_name', 'village_name', 'district_name', 'zone_name',
            'status', 'member_status', 'contribution_score', 'points', 'latitude', 'longitude',
            'instrument', 'manufacturer', 'model_number', 'depth_meters', 'frequency_range',
            'written_description', 'duration_seconds', 'recording_date', 'recording_time',
            'created_at', 'audio_url',
        ]


class OceanSoundDetailSerializer(CitizenFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = OceanSound
        fields = '__all__'


class OceanSoundCreateSerializer(serializers.ModelSerializer):
    """Mobile Ocean Sound submission.

    Carries the admin "Add sound item" fields (category, name, slug, sort
    order, source, description, document name + photo/spectrogram/document
    files). The SoundItem library entry is created when the contribution is
    verified — the fields are stored on Contribution.metadata and the files
    become ContributionMedia rows with wizard roles.
    """

    latitude = serializers.FloatField(write_only=True, required=False)
    longitude = serializers.FloatField(write_only=True, required=False)
    village = serializers.UUIDField(write_only=True, required=False)

    # SoundItem library fields (admin parity) — input only.
    name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=200)
    category = serializers.CharField(write_only=True, required=False, allow_blank=True)
    slug = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=200)
    sort_order = serializers.IntegerField(write_only=True, required=False, min_value=0, default=0)
    source = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=100)
    description = serializers.CharField(write_only=True, required=False, allow_blank=True, style={'base_template': 'textarea.html'})
    document_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=200)
    photo_file = serializers.ImageField(write_only=True, required=False)
    spectrogram_file = serializers.ImageField(write_only=True, required=False)
    document = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = OceanSound
        fields = [
            'id',
            'audio_file', 'instrument', 'manufacturer', 'model_number', 'depth_meters',
            'measurement_method', 'voice_description', 'written_description',
            'environmental_conditions', 'frequency_range', 'duration_seconds',
            'recording_date', 'recording_time', 'latitude', 'longitude', 'village',
            'name', 'category', 'slug', 'sort_order', 'source', 'description',
            'document_name', 'photo_file', 'spectrogram_file', 'document',
        ]

    def validate_category(self, value):
        if not value:
            return ''
        if SoundCategory.objects.exists() and not SoundCategory.objects.filter(slug=value).exists():
            raise serializers.ValidationError(f"Unknown category '{value}'.")
        return value

    def validate_photo_file(self, file):
        if file:
            validate_media_file(file, 'image')
        return file

    def validate_spectrogram_file(self, file):
        if file:
            validate_media_file(file, 'image')
        return file

    def validate_document(self, file):
        if file:
            validate_media_file(file, 'document')
        return file

    def create(self, validated_data):
        from core.html_utils import sanitize_html
        from contributions.models import Contribution
        from contributions.scoring import calculate_contribution_points
        from contributions.serializers import create_media_rows
        from django.contrib.gis.geos import Point

        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)
        village_id = validated_data.pop('village', None)

        # SoundItem library fields — stored on the contribution, applied at publish.
        name = validated_data.pop('name', '') or ''
        category = validated_data.pop('category', '') or ''
        slug = validated_data.pop('slug', '') or ''
        sort_order = validated_data.pop('sort_order', 0) or 0
        source = validated_data.pop('source', '') or ''
        description = validated_data.pop('description', '') or ''
        document_name = validated_data.pop('document_name', '') or ''
        photo_file = validated_data.pop('photo_file', None)
        spectrogram_file = validated_data.pop('spectrogram_file', None)
        document = validated_data.pop('document', None)

        location = None
        if latitude and longitude:
            location = Point(longitude, latitude, srid=4326)

        def jsonable(value):
            return value.isoformat() if hasattr(value, 'isoformat') else value

        # Legacy research fields + library fields (unknown keys are preserved
        # by validate_metadata elsewhere; stored raw here).
        metadata = {
            key: jsonable(value)
            for key, value in validated_data.items()
            if key not in ('audio_file', 'voice_description') and value not in (None, '')
        }
        metadata.update({
            'sound_category': category,
            'slug': slug,
            'sort_order': sort_order,
            'source': source,
            'document_name': document_name,
        })

        clean_description = sanitize_html(description)
        contribution = Contribution.objects.create(
            user=self.context['request'].user,
            type='ocean_sound',
            status='submitted',
            title=name or 'Ocean sound',
            description=clean_description,
            metadata=metadata,
            location=location,
            village_id=village_id,
            points=calculate_contribution_points('ocean_sound', 'submitted'),
        )

        # Media rows carry wizard roles (primary_audio / general / spectrogram /
        # document) so publish can build the SoundItem from them.
        media_files = {'audio': validated_data.pop('audio_file')}
        if photo_file:
            media_files['images'] = [photo_file]
        if spectrogram_file:
            media_files['spectrogram'] = spectrogram_file
        if document:
            media_files['documents'] = [document]
        create_media_rows(contribution, media_files)
        audio_row = contribution.media.filter(kind='audio').order_by('order').first()

        return OceanSound.objects.create(
            contribution=contribution,
            audio_file=audio_row.file,
            **validated_data,
        )


def _absolute_media_url(serializer, file_field):
    """Return an absolute URL for a FileField/ImageField (mobile needs a full URL)."""
    if not file_field:
        return None
    url = file_field.url
    request = serializer.context.get('request')
    if request is not None:
        return request.build_absolute_uri(url)
    return url


class SoundItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    audio_url = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    spectrogram_url = serializers.SerializerMethodField()
    document_url = serializers.SerializerMethodField()
    document_name = serializers.CharField(source='display_document_name', read_only=True)
    document_type = serializers.CharField(read_only=True)
    document_size = serializers.IntegerField(read_only=True)

    class Meta:
        model = SoundItem
        fields = [
            'id', 'name', 'slug', 'description', 'source', 'sort_order',
            'category', 'category_name', 'category_slug',
            'audio_url', 'photo_url', 'spectrogram_url',
            'document_url', 'document_name', 'document_type', 'document_size',
            'created_at',
        ]

    def get_audio_url(self, obj):
        return _absolute_media_url(self, obj.audio_file)

    def get_photo_url(self, obj):
        return _absolute_media_url(self, obj.photo_file)

    def get_spectrogram_url(self, obj):
        return _absolute_media_url(self, obj.spectrogram_file)

    def get_document_url(self, obj):
        return _absolute_media_url(self, obj.document)


class SoundCategorySerializer(serializers.ModelSerializer):
    items = SoundItemSerializer(many=True, read_only=True)
    children = serializers.SerializerMethodField()
    document_url = serializers.SerializerMethodField()
    document_name = serializers.CharField(source='display_document_name', read_only=True)
    document_type = serializers.CharField(read_only=True)
    document_size = serializers.IntegerField(read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = SoundCategory
        fields = [
            'id', 'name', 'slug', 'parent', 'description', 'icon', 'sort_order',
            'document_url', 'document_name', 'document_type', 'document_size',
            'items', 'children', 'item_count',
        ]

    def get_children(self, obj):
        children = obj.children.all()
        return SoundCategorySerializer(children, many=True, context=self.context).data

    def get_document_url(self, obj):
        return _absolute_media_url(self, obj.document)

    def get_item_count(self, obj):
        """Number of sounds in this category, including sub-categories."""
        return len(_collect_items(obj))


def _collect_items(category):
    items = list(category.items.all())
    for child in category.children.all():
        items.extend(_collect_items(child))
    return items

