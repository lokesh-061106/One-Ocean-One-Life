from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers
from core.choices import CONTRIBUTOR_TYPE_CHOICES
from core.html_utils import sanitize_html
from .models import Contribution, ContributionMedia, ContributionType
from .scoring import calculate_contribution_points
from .schemas import (
    geotag_required,
    has_required_metadata,
    validate_media_requirements,
    validate_metadata,
)

MEDIA_MAX_SIZE = {
    'image': 10 * 1024 * 1024,
    'video': 100 * 1024 * 1024,
    'audio': 50 * 1024 * 1024,
    'document': 10 * 1024 * 1024,
}

MEDIA_ALLOWED_EXTENSIONS = {
    'image': {'jpg', 'jpeg', 'png', 'webp', 'heic'},
    'video': {'mp4', 'mov', 'm4v'},
    'audio': {'mp3', 'wav', 'ogg', 'm4a', 'aac'},
    'document': {
        'pdf', 'doc', 'docx', 'docm', 'dot', 'dotx', 'dotm',
        'xls', 'xlsx', 'xlsm', 'xlsb', 'csv',
        'ppt', 'pptx', 'pps', 'ppsx',
        'txt', 'rtf', 'odt', 'ods', 'odp',
    },
}

MODERATOR_ROLES = ['MODERATOR', 'SCIENTIFIC_VALIDATOR', 'ADMIN', 'SUPER_ADMIN']


def _file_ext(filename):
    return (filename or '').rsplit('.', 1)[-1].lower() if '.' in (filename or '') else ''


def validate_media_file(file, kind):
    ext = _file_ext(file.name)
    allowed = MEDIA_ALLOWED_EXTENSIONS.get(kind, set())
    if ext not in allowed:
        raise serializers.ValidationError(
            f"Unsupported {kind} file type '.{ext}'. Allowed: {', '.join(sorted(allowed))}."
        )
    max_size = MEDIA_MAX_SIZE.get(kind, 10 * 1024 * 1024)
    if file.size > max_size:
        limit_mb = max_size // (1024 * 1024)
        raise serializers.ValidationError(
            f"{kind.capitalize()} '{file.name}' exceeds the {limit_mb}MB limit."
        )
    return file


# --------------------------------------------------------------------------- #
# Shared helpers for the create/update serializers
# --------------------------------------------------------------------------- #

# wizard input name -> (ContributionMedia kind, role)
MEDIA_INPUT_MAP = {
    'images': ('image', 'general'),
    'location_photo': ('image', 'location_photo'),
    'setup_images': ('image', 'setup_photo'),
    'species_images': ('image', 'species_photo'),
    'spectrogram': ('image', 'spectrogram'),
    'video': ('video', 'video'),
    'audio': ('audio', 'primary_audio'),
    'voice_note': ('audio', 'voice_note'),
    'documents': ('document', 'document'),
}

# wizard input name -> filter used to test existing rows on an instance
MEDIA_EXISTING_QUERY = {
    'images': {'kind': 'image'},
    'location_photo': {'kind': 'image', 'role': 'location_photo'},
    'setup_images': {'kind': 'image', 'role': 'setup_photo'},
    'species_images': {'kind': 'image', 'role': 'species_photo'},
    'spectrogram': {'kind': 'image', 'role': 'spectrogram'},
    'video': {'kind': 'video'},
    'audio': {'kind': 'audio'},
    'voice_note': {'kind': 'audio', 'role': 'voice_note'},
    'documents': {'kind': 'document'},
}


def pop_media_files(validated_data):
    """Pull every media input out of validated_data as {input_name: files}."""
    media = {}
    for name in MEDIA_INPUT_MAP:
        value = validated_data.pop(name, None)
        if value in (None, [], ''):
            continue
        media[name] = value
    return media


def create_media_rows(contribution, media_files, replace_video_audio=False):
    """Create ContributionMedia rows (with roles) and return evidence type."""
    if replace_video_audio:
        for name in ('video', 'audio', 'voice_note', 'location_photo', 'spectrogram'):
            if name in media_files:
                _, role = MEDIA_INPUT_MAP[name]
                contribution.media.filter(role=role).delete()

    order = contribution.media.count()
    for name, files in media_files.items():
        kind, role = MEDIA_INPUT_MAP[name]
        items = files if isinstance(files, list) else [files]
        for item in items:
            ContributionMedia.objects.create(
                contribution=contribution, kind=kind, role=role,
                file=item, order=order,
            )
            order += 1

    kinds = set(contribution.media.values_list('kind', flat=True))
    labels = [('Photo', 'image'), ('Video', 'video'), ('Audio', 'audio'), ('Document', 'document')]
    evidence = [label for label, kind in labels if kind in kinds]
    contribution.evidence_type = ' + '.join(evidence)
    contribution.save(update_fields=['evidence_type'])
    return contribution.evidence_type


def _remember_contributor_type(user, contributor_type):
    try:
        profile = user.profile
    except Exception:
        return
    if profile.contributor_type != contributor_type:
        profile.contributor_type = contributor_type
        profile.save(update_fields=['contributor_type'])


def apply_submission_rules(attrs, contribution_type, is_draft, instance=None):
    """Validate metadata, geotag and media rules for a contribution payload.

    Media presence is read from ``attrs`` (files in this payload) and, when
    ``instance`` is given, from the stored media rows — so submitting a saved
    draft without re-uploading files still passes.
    Raises DRF ValidationError on failure.
    """
    metadata = attrs.get('metadata')
    if metadata is not None:
        try:
            attrs['metadata'] = validate_metadata(
                contribution_type, metadata, require_fields=not is_draft,
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'metadata': exc.messages})

    if is_draft:
        return attrs

    if geotag_required(contribution_type):
        if attrs.get('latitude') is None or attrs.get('longitude') is None:
            existing = bool(instance and instance.location)
            if not existing:
                raise serializers.ValidationError({
                    'latitude': 'GPS coordinates are required for this contribution type.',
                })

    def has_field(name):
        if name in attrs:
            value = attrs[name]
            if isinstance(value, list):
                if len(value) > 0:
                    return True
            elif value is not None:
                return True
        if instance is not None:
            try:
                return instance.media.filter(**MEDIA_EXISTING_QUERY[name]).exists()
            except Exception:
                return False
        return False

    try:
        validate_media_requirements(contribution_type, has_field)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(exc.messages)

    if metadata is None and has_required_metadata(contribution_type):
        # Client omitted metadata entirely — still enforce required fields
        # against what is already stored (create: nothing stored).
        payload = dict(instance.metadata) if instance is not None and instance.metadata else {}
        try:
            validate_metadata(contribution_type, payload, require_fields=True)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'metadata': exc.messages})

    return attrs


class ContributionMediaSerializer(serializers.ModelSerializer):
    url = serializers.FileField(source='file', read_only=True)
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = ContributionMedia
        fields = ['id', 'kind', 'role', 'url', 'display_name', 'name', 'caption', 'order', 'created_at']


class ContributionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContributionType
        fields = ['id', 'name', 'slug', 'description', 'points_verified', 'points_submitted', 'is_active']


class ContributionListSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    zone_name = serializers.CharField(source='zone.name', read_only=True, default=None)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    author_display = serializers.SerializerMethodField()
    media = ContributionMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Contribution
        fields = [
            'id', 'user', 'user_name', 'author', 'author_display', 'title', 'slug',
            'type', 'type_display', 'status', 'status_display',
            'contributor_type',
            'village', 'village_name', 'zone', 'zone_name',
            'quality_score', 'points', 'notes', 'description', 'metadata',
            'safety_status', 'moderation_decision', 'visibility_status',
            'media', 'submitted_at', 'verified_at', 'created_at',
        ]

    def get_author_display(self, obj):
        return obj.author or (obj.user.username if obj.user else '')


class ContributionDetailSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    zone_name = serializers.CharField(source='zone.name', read_only=True, default=None)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    author_display = serializers.SerializerMethodField()
    media = ContributionMediaSerializer(many=True, read_only=True)
    is_public = serializers.BooleanField(read_only=True)

    class Meta:
        model = Contribution
        fields = '__all__'

    def get_author_display(self, obj):
        return obj.author or (obj.user.username if obj.user else '')


class PublicContributionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    author_display = serializers.SerializerMethodField()
    media = ContributionMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Contribution
        fields = [
            'id', 'user_name', 'author', 'author_display', 'title', 'slug',
            'type', 'type_display', 'status', 'village', 'village_name',
            'contributor_type', 'metadata',
            'points', 'notes', 'description', 'media',
            'verified_at', 'created_at',
        ]

    def get_author_display(self, obj):
        return obj.author or (obj.user.username if obj.user else '')


class ContributionCreateSerializer(serializers.ModelSerializer):
    """Create a contribution from the submission wizard.

    Accepts the shared media inputs (with roles), GPS coordinates, the
    "Who are you?" contributor identity, per-type metadata and a draft flag.
    """

    images = serializers.ListField(
        child=serializers.ImageField(), required=False, write_only=True,
    )
    location_photo = serializers.ImageField(required=False, write_only=True)
    setup_images = serializers.ListField(
        child=serializers.ImageField(), required=False, write_only=True,
    )
    species_images = serializers.ListField(
        child=serializers.ImageField(), required=False, write_only=True,
    )
    spectrogram = serializers.ImageField(required=False, write_only=True)
    video = serializers.FileField(required=False, write_only=True)
    audio = serializers.FileField(required=False, write_only=True)
    voice_note = serializers.FileField(required=False, write_only=True)
    documents = serializers.ListField(
        child=serializers.FileField(), required=False, write_only=True,
    )

    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    contributor_type = serializers.ChoiceField(
        choices=CONTRIBUTOR_TYPE_CHOICES, required=False, allow_blank=True,
    )
    remember_contributor_type = serializers.BooleanField(required=False, write_only=True)
    draft = serializers.BooleanField(required=False, write_only=True)

    class Meta:
        model = Contribution
        fields = [
            'id', 'title', 'type', 'author', 'village', 'zone', 'points', 'status',
            'notes', 'description', 'location', 'location_precision', 'metadata',
            'contributor_type', 'latitude', 'longitude',
            'images', 'location_photo', 'setup_images', 'species_images', 'spectrogram',
            'video', 'audio', 'voice_note', 'documents',
            'draft', 'remember_contributor_type',
        ]
        read_only_fields = ['location', 'id']

    # ---- field validators -------------------------------------------------
    def validate_title(self, value):
        return (value or '').strip()

    def validate_village(self, value):
        return value

    def _validate_image_list(self, files, limit=10):
        if not files:
            return files
        if len(files) > limit:
            raise serializers.ValidationError(f'A maximum of {limit} images is allowed.')
        for f in files:
            validate_media_file(f, 'image')
        return files

    def validate_images(self, files):
        return self._validate_image_list(files)

    def validate_setup_images(self, files):
        return self._validate_image_list(files, limit=5)

    def validate_species_images(self, files):
        return self._validate_image_list(files, limit=5)

    def validate_spectrogram(self, file):
        if file:
            validate_media_file(file, 'image')
        return file

    def validate_location_photo(self, file):
        if file:
            validate_media_file(file, 'image')
        return file

    def validate_video(self, file):
        if file:
            validate_media_file(file, 'video')
        return file

    def validate_audio(self, file):
        if file:
            validate_media_file(file, 'audio')
        return file

    def validate_voice_note(self, file):
        if file:
            validate_media_file(file, 'audio')
        return file

    def validate_documents(self, files):
        if not files:
            return files
        if len(files) > 5:
            raise serializers.ValidationError('A maximum of 5 documents is allowed.')
        for f in files:
            validate_media_file(f, 'document')
        return files

    def validate_latitude(self, value):
        if value is None:
            return value
        if not -90 <= value <= 90:
            raise serializers.ValidationError('Latitude must be between -90 and 90.')
        return value

    def validate_longitude(self, value):
        if value is None:
            return value
        if not -180 <= value <= 180:
            raise serializers.ValidationError('Longitude must be between -180 and 180.')
        return value

    # ---- object-level validation -----------------------------------------
    def validate(self, attrs):
        ctype = attrs.get('type')
        is_draft = bool(attrs.get('draft'))

        apply_submission_rules(attrs, ctype, is_draft=is_draft)

        # Contributor identity: explicit value wins, else profile default,
        # else derive from the account role (set at registration).
        if not attrs.get('contributor_type'):
            profile = getattr(self.context['request'].user, 'profile', None)
            if profile and profile.contributor_type:
                attrs['contributor_type'] = profile.contributor_type
            else:
                from accounts.serializers import contributor_type_for_role
                attrs['contributor_type'] = contributor_type_for_role(
                    getattr(self.context['request'].user, 'role', '')
                )

        return attrs

    def create(self, validated_data):
        request = self.context['request']
        is_draft = bool(validated_data.pop('draft', False))
        remember = bool(validated_data.pop('remember_contributor_type', False))
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)
        media_files = pop_media_files(validated_data)

        if latitude is not None and longitude is not None:
            validated_data['location'] = Point(longitude, latitude, srid=4326)

        metadata = validated_data.get('metadata') or {}

        # Status: draft saves stay private; expert-ID submissions jump the queue
        # to scientific review; everything else enters the normal pipeline.
        if is_draft:
            validated_data['status'] = 'draft'
        else:
            validated_data['status'] = (
                'scientific_review' if metadata.get('needs_expert_id') else 'submitted'
            )
            validated_data['submitted_at'] = timezone.now()

        validated_data['user'] = request.user
        if not validated_data.get('author'):
            validated_data['author'] = request.user.get_full_name() or request.user.username
        if not validated_data.get('title'):
            base = (validated_data.get('notes') or '').strip()
            if base and len(base) > 80:
                base = base[:80].rsplit(' ', 1)[0] + '…'
            validated_data['title'] = base or validated_data.get('type', 'Contribution').replace('_', ' ').title()
        else:
            validated_data['title'] = validated_data['title'].strip()
        if validated_data.get('notes'):
            validated_data['notes'] = sanitize_html(validated_data['notes'])
        if validated_data.get('description'):
            validated_data['description'] = sanitize_html(validated_data['description'])

        # Points: contributors get the type default; admins may override.
        is_admin = (
            request.user.is_superuser
            or request.user.role in ['ADMIN', 'SUPER_ADMIN']
        )
        if is_admin and validated_data.get('points') is not None:
            points = int(validated_data.pop('points') or 0)
        else:
            validated_data.pop('points', None)
            points = calculate_contribution_points(validated_data['type'], 'submitted')
        validated_data['points'] = points

        contribution = Contribution.objects.create(**validated_data)

        create_media_rows(contribution, media_files)

        # Lightweight safety / relevance screen (fields already on the model).
        from .safety import screen_contribution
        screen_contribution(contribution)
        contribution.save(update_fields=[
            'safety_status', 'safety_category', 'relevance_level', 'moderation_decision',
        ])

        if remember and contribution.contributor_type:
            _remember_contributor_type(request.user, contribution.contributor_type)

        try:
            from .tasks import update_user_score_task
            update_user_score_task.delay(str(request.user.id))
        except Exception:
            pass

        return contribution


class ContributionUpdateSerializer(serializers.ModelSerializer):
    """Edit a contribution (and optionally submit a saved draft)."""

    images = serializers.ListField(
        child=serializers.ImageField(), required=False, write_only=True,
    )
    location_photo = serializers.ImageField(required=False, write_only=True)
    setup_images = serializers.ListField(
        child=serializers.ImageField(), required=False, write_only=True,
    )
    species_images = serializers.ListField(
        child=serializers.ImageField(), required=False, write_only=True,
    )
    spectrogram = serializers.ImageField(required=False, write_only=True)
    video = serializers.FileField(required=False, write_only=True)
    audio = serializers.FileField(required=False, write_only=True)
    voice_note = serializers.FileField(required=False, write_only=True)
    documents = serializers.ListField(
        child=serializers.FileField(), required=False, write_only=True,
    )
    remove_media_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True,
    )
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    contributor_type = serializers.ChoiceField(
        choices=CONTRIBUTOR_TYPE_CHOICES, required=False, allow_blank=True,
    )
    submit = serializers.BooleanField(required=False, write_only=True)
    media = ContributionMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Contribution
        fields = [
            'title', 'author', 'type', 'village', 'zone', 'notes', 'description',
            'location', 'location_precision', 'metadata', 'contributor_type',
            'latitude', 'longitude', 'media',
            'images', 'location_photo', 'setup_images', 'species_images', 'spectrogram',
            'video', 'audio', 'voice_note', 'documents',
            'remove_media_ids', 'submit',
        ]
        read_only_fields = ['location']

    def validate_latitude(self, value):
        if value is None:
            return value
        if not -90 <= value <= 90:
            raise serializers.ValidationError('Latitude must be between -90 and 90.')
        return value

    def validate_longitude(self, value):
        if value is None:
            return value
        if not -180 <= value <= 180:
            raise serializers.ValidationError('Longitude must be between -180 and 180.')
        return value

    def validate_images(self, files):
        return _validate_image_files(files, limit=10)

    def validate_setup_images(self, files):
        return _validate_image_files(files, limit=5)

    def validate_species_images(self, files):
        return _validate_image_files(files, limit=5)

    def validate_spectrogram(self, file):
        if file:
            validate_media_file(file, 'image')
        return file

    def validate_location_photo(self, file):
        if file:
            validate_media_file(file, 'image')
        return file

    def validate_video(self, file):
        if file:
            validate_media_file(file, 'video')
        return file

    def validate_audio(self, file):
        if file:
            validate_media_file(file, 'audio')
        return file

    def validate_voice_note(self, file):
        if file:
            validate_media_file(file, 'audio')
        return file

    def validate_documents(self, files):
        for f in files or []:
            validate_media_file(f, 'document')
        return files

    def validate(self, attrs):
        ctype = attrs.get('type') or (self.instance.type if self.instance else None)
        is_submitting = bool(attrs.get('submit'))

        apply_submission_rules(
            attrs,
            ctype,
            is_draft=not is_submitting,
            instance=self.instance,
        )
        return attrs

    def update(self, instance, validated_data):
        submit = bool(validated_data.pop('submit', False))
        remove_ids = validated_data.pop('remove_media_ids', [])
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)
        media_files = pop_media_files(validated_data)

        if remove_ids:
            instance.media.filter(id__in=remove_ids).delete()

        if latitude is not None and longitude is not None:
            validated_data['location'] = Point(longitude, latitude, srid=4326)

        if validated_data.get('notes'):
            validated_data['notes'] = sanitize_html(validated_data['notes'])
        if validated_data.get('description'):
            validated_data['description'] = sanitize_html(validated_data['description'])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if submit and instance.status == 'draft':
            metadata = instance.metadata or {}
            instance.status = (
                'scientific_review' if metadata.get('needs_expert_id') else 'submitted'
            )
            instance.submitted_at = timezone.now()

        instance.save()

        create_media_rows(instance, media_files, replace_video_audio=True)

        from .safety import screen_contribution
        screen_contribution(instance)
        instance.save(update_fields=[
            'safety_status', 'safety_category', 'relevance_level', 'moderation_decision',
        ])
        return instance


def _validate_image_files(files, limit=10):
    if not files:
        return files
    if len(files) > limit:
        raise serializers.ValidationError(f'A maximum of {limit} images is allowed.')
    for f in files:
        validate_media_file(f, 'image')
    return files


class ContributionReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=['approve', 'reject', 'verify', 'validate', 'review'], required=False,
    )
    status = serializers.ChoiceField(
        choices=[c[0] for c in Contribution.STATUS_CHOICES], required=False,
    )
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    quality_score = serializers.FloatField(required=False, min_value=0, max_value=100)
    points = serializers.IntegerField(required=False, min_value=0)
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        if not attrs.get('action') and not attrs.get('status'):
            raise serializers.ValidationError('action or status is required.')
        return attrs
