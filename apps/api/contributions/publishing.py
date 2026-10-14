"""Publish-side actions that run when a contribution is approved."""


def create_child_records(contribution):
    """Create module child rows for approved contributions.

    Each public gallery (sightings, sounds, education, guides, catches,
    observations, events, cleanups) reads from its own model. We mirror
    approved contributions into those tables so the existing module pages
    pick the content up automatically.
    """
    created = []
    if contribution.type == 'marine_sighting':
        created.append(_ensure_marine_sighting(contribution))
    elif contribution.type == 'ocean_sound':
        created.append(_ensure_ocean_sound(contribution))
        created.append(_ensure_sound_item(contribution))
    elif contribution.type == 'education_post':
        created.append(_ensure_education_post(contribution))
    elif contribution.type == 'local_knowledge':
        created.append(_ensure_guide_species(contribution))
    elif contribution.type == 'fish_catch':
        created.append(_ensure_fish_catch(contribution))
    elif contribution.type == 'observation':
        created.append(_ensure_observation(contribution))
    elif contribution.type == 'event':
        created.append(_ensure_event(contribution))
    elif contribution.type == 'beach_cleanup':
        # Both rows count: analytics reads Event, the storefront reads
        # BeachCleanupEvent. _ensure_event is idempotent and is also called
        # from inside _ensure_beach_cleanup.
        created.append(_ensure_event(contribution))
        created.append(_ensure_beach_cleanup(contribution))
    return [c for c in created if c]


def _has_content(contribution):
    """True when the contribution carries readable text.

    Guards the text-based mirrors: legacy spreadsheet imports are type
    education_post / local_knowledge / observation but have no title, notes
    or description, and minting a child for them only produces an empty card
    in the public gallery.
    """
    return bool(
        (contribution.title or '').strip()
        or (contribution.notes or '').strip()
        or (contribution.description or '').strip()
    )


def _first_media(contribution, kind):
    return contribution.media.filter(kind=kind).order_by('order', 'created_at').first()


def _first_image(contribution):
    """Prefer a general photo, fall back to any image role."""
    qs = contribution.media.filter(kind='image').order_by('order', 'created_at')
    return qs.filter(role='general').first() or qs.first()


def _role_media(contribution, role):
    return contribution.media.filter(role=role).order_by('order', 'created_at').first()


def _choice_label(choices, value):
    for key, label in choices:
        if key == value:
            return label
    return value or ''


def _sighting_category(group):
    from sightings.models import SightingCategory

    hints = {
        'dolphin': 'dolphin', 'whale': 'whale', 'turtle': 'turtle',
        'shark': 'shark', 'ray': 'shark', 'fish': 'fish', 'seabird': 'seabird',
    }
    hint = hints.get(group or '')
    if not hint:
        return None
    return SightingCategory.objects.filter(name__icontains=hint).first()


def _ensure_marine_sighting(contribution):
    from sightings.models import MarineSighting, SightingImage
    from .schemas import BEHAVIOUR_CHOICES, SEA_CONDITION_CHOICES, WEATHER_CHOICES

    if hasattr(contribution, 'marine_sighting'):
        return contribution.marine_sighting

    meta = contribution.metadata or {}
    image = _first_image(contribution)
    video = _first_media(contribution, 'video')

    species = None
    guide_id = meta.get('species_guide_id')
    if guide_id:
        from guides.models import GuideSpecies
        species = GuideSpecies.objects.filter(pk=guide_id).first()

    behaviour = meta.get('behaviour') or 'unknown'
    valid_behaviours = {k for k, _ in BEHAVIOUR_CHOICES}
    if behaviour not in valid_behaviours:
        behaviour = 'unknown'

    sighting = MarineSighting.objects.create(
        contribution=contribution,
        photo=image.file if image else None,
        video=video.file if video else None,
        species=species,
        category=_sighting_category(meta.get('species_group')),
        number_observed=int(meta.get('individuals') or 1),
        behavior=behaviour,
        sea_condition=_choice_label(SEA_CONDITION_CHOICES, meta.get('sea_condition', '')),
        weather=_choice_label(WEATHER_CHOICES, meta.get('weather', '')),
        ai_species_suggestion=(
            meta.get('species_name', '') if not species else ''
        ),
        notes=contribution.notes or contribution.title or '',
        sighting_date=contribution.created_at.date() if contribution.created_at else None,
    )
    for media in contribution.media.filter(kind='image').order_by('order', 'created_at'):
        SightingImage.objects.create(
            sighting=sighting,
            image=media.file,
            caption=media.caption or media.name,
            sort_order=media.order,
        )
    return sighting


def _ensure_ocean_sound(contribution):
    from ocean_sounds.models import OceanSound
    from .schemas import INSTRUMENT_CHOICES, RECORDING_ENVIRONMENT_CHOICES

    if hasattr(contribution, 'ocean_sound'):
        return contribution.ocean_sound

    audio = _first_media(contribution, 'audio')
    if not audio:
        return None

    meta = contribution.metadata or {}
    method_parts = [
        text for text in (
            meta.get('recording_method'),
            f"Calibration: {meta['calibration_info']}" if meta.get('calibration_info') else '',
        ) if text
    ]
    environment = dict(RECORDING_ENVIRONMENT_CHOICES).get(
        meta.get('recording_environment'), meta.get('recording_environment', '')
    )
    conditions = {
        'recording_environment': environment,
        'sampling_rate': meta.get('sampling_rate', ''),
        'recording_duration': meta.get('recording_duration', ''),
    }
    voice_note = _role_media(contribution, 'voice_note')

    return OceanSound.objects.create(
        contribution=contribution,
        audio_file=audio.file,
        voice_description=voice_note.file if voice_note else None,
        instrument=_choice_label(INSTRUMENT_CHOICES, meta.get('instrument', '')),
        model_number=meta.get('instrument_model', ''),
        depth_meters=meta.get('depth_m'),
        measurement_method='; '.join(method_parts),
        environmental_conditions=conditions,
        frequency_range=meta.get('sampling_rate', ''),
        written_description=contribution.description or contribution.notes or '',
    )


def _ensure_sound_item(contribution):
    """Mirror an approved ocean_sound into the curated Sound Library (SoundItem).

    Mirrors the Django admin "Add sound item" form:
    category, name (from title), slug (auto), sort_order (0), source,
    description, audio / photo / spectrogram / document + document_name.
    """
    from django.utils.text import slugify
    from ocean_sounds.models import SoundCategory, SoundItem

    if hasattr(contribution, 'sound_item'):
        return contribution.sound_item

    # No audio means no sound: never mint a blank library entry. Legacy
    # spreadsheet imports are type ocean_sound but carry no recording.
    audio = _first_media(contribution, 'audio')
    audio_file = audio.file if audio else None
    # Rows imported straight into OceanSound have no ContributionMedia rows at
    # all — borrow the recording already attached to that child instead.
    existing = contribution.ocean_sound if hasattr(contribution, 'ocean_sound') else None
    if audio_file is None and existing is not None and existing.audio_file:
        audio_file = existing.audio_file
    if not audio_file:
        return None

    meta = contribution.metadata or {}
    image = _first_image(contribution)
    spectrogram = _role_media(contribution, 'spectrogram')
    document = _first_media(contribution, 'document')

    category_slug = meta.get('sound_category') or ''
    category = SoundCategory.objects.filter(slug=category_slug).first()
    if category is None:
        category = SoundCategory.objects.filter(parent__isnull=True).first()
    if category is None:
        category, _ = SoundCategory.objects.get_or_create(
            slug='community-sounds',
            defaults={'name': 'Community Sounds', 'icon': '🌊'},
        )

    notes = (contribution.notes or '').strip()
    name = (contribution.title or '').strip() or notes or 'Ocean sound'
    description = (
        contribution.description
        or (existing.written_description if existing else '')
        or notes
        or ''
    )
    raw_slug = str(meta.get('slug') or '').strip()
    base = (slugify(raw_slug) if raw_slug else slugify(name))[:180] or 'ocean-sound'
    slug = base
    counter = 2
    while SoundItem.objects.filter(slug=slug).exists():
        slug = f'{base}-{counter}'
        counter += 1

    try:
        sort_order = int(meta.get('sort_order') or 0)
    except (TypeError, ValueError):
        sort_order = 0

    return SoundItem.objects.create(
        contribution=contribution,
        category=category,
        name=name,
        slug=slug,
        description=description,
        source=meta.get('source') or 'NOAA 2023',
        audio_file=audio_file,
        photo_file=image.file if image else None,
        spectrogram_file=spectrogram.file if spectrogram else None,
        document=document.file if document else None,
        document_name=meta.get('document_name') or '',
        sort_order=sort_order,
    )


def _ensure_education_post(contribution):
    from education.models import EducationPost

    if hasattr(contribution, 'education_post'):
        return contribution.education_post

    # No text means no post: legacy spreadsheet imports carry no readable
    # content and would only mint an empty "Community contribution" card.
    if not _has_content(contribution):
        return None

    image = _first_media(contribution, 'image')
    return EducationPost.objects.create(
        author=contribution.user,
        contribution=contribution,
        title=contribution.title or 'Community contribution',
        content=contribution.description or contribution.notes or '',
        post_type='knowledge',
        village=contribution.village,
        image=image.file if image else None,
        is_verified=True,
    )


def _ensure_guide_species(contribution):
    from guides.models import GuideCategory, GuideSpecies

    if hasattr(contribution, 'guide_species'):
        return contribution.guide_species

    # No text means no guide entry: 196 of the 197 legacy local_knowledge rows
    # are blank and would flood /guides with identical empty cards.
    if not _has_content(contribution):
        return None

    category, _ = GuideCategory.objects.get_or_create(
        slug='community-knowledge',
        defaults={'name': 'Community Knowledge', 'icon': '📚'},
    )
    image = _first_media(contribution, 'image')
    return GuideSpecies.objects.create(
        category=category,
        contribution=contribution,
        common_name=contribution.title or 'Community knowledge',
        scientific_name='Not specified',
        description=contribution.description or contribution.notes or '',
        image=image.file if image else None,
        is_verified=True,
    )


def _coerce_float(value):
    if value in (None, ''):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _coerce_int(value, default=0):
    if value in (None, ''):
        return default
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _coerce_day(value, fallback=None):
    """Normalise a wizard 'date' value to a ``datetime.date``."""
    from datetime import date as date_cls, datetime
    from django.utils.dateparse import parse_date, parse_datetime

    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date_cls):
        return value
    text = str(value or '').strip()
    if not text:
        return fallback
    parsed_date = parse_date(text)
    if parsed_date:
        return parsed_date
    parsed_dt = parse_datetime(text)
    if parsed_dt:
        return parsed_dt.date()
    return fallback


def _coerce_start(value, fallback=None):
    """Normalise a wizard 'date' value to an aware ``datetime`` for start_date."""
    from datetime import date as date_cls, datetime, time as time_cls
    from django.utils import timezone
    from django.utils.dateparse import parse_date, parse_datetime

    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, date_cls):
        dt = datetime.combine(value, time_cls.min)
    else:
        text = str(value or '').strip()
        dt = None
        if text:
            dt = parse_datetime(text)
            if dt is None:
                day = parse_date(text)
                if day:
                    dt = datetime.combine(day, time_cls.min)
        if dt is None:
            return fallback
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


def _ensure_fish_catch(contribution):
    from catches.models import FishCatch
    from .schemas import GEAR_CHOICES, SPECIES_GROUP_CHOICES, SPECIES_LEVEL_CHOICES

    if hasattr(contribution, 'fish_catch'):
        return contribution.fish_catch

    meta = contribution.metadata or {}
    image = _first_image(contribution)

    level = meta.get('species_level') or ''
    if level not in {k for k, _ in SPECIES_LEVEL_CHOICES}:
        level = ''
    group = meta.get('species_group') or ''
    if group not in {k for k, _ in SPECIES_GROUP_CHOICES}:
        group = ''
    gear = meta.get('gear') or ''
    if gear not in {k for k, _ in GEAR_CHOICES}:
        gear = 'other' if meta.get('gear_other') else ''

    number = _coerce_int(meta.get('number'), 1)
    if number < 1:
        number = 1

    return FishCatch.objects.create(
        contribution=contribution,
        species_level=level,
        species_name=str(meta.get('species_name') or '').strip(),
        species_guide_id=str(meta.get('species_guide_id') or '').strip(),
        species_group=group,
        number=number,
        weight=_coerce_float(meta.get('weight')),
        weight_unit=meta.get('weight_unit') if meta.get('weight_unit') in ('kg', 'g') else 'kg',
        length=_coerce_float(meta.get('length')),
        length_unit=meta.get('length_unit') if meta.get('length_unit') in ('cm', 'm') else 'cm',
        gear=gear,
        gear_other=str(meta.get('gear_other') or '').strip(),
        depth_m=_coerce_float(meta.get('depth_m')),
        fishing_location_name=str(meta.get('fishing_location_name') or '').strip(),
        photo=image.file if image else None,
    )


def _ensure_observation(contribution):
    from observations.models import Observation
    from .schemas import OBSERVATION_CATEGORY_CHOICES

    if hasattr(contribution, 'observation'):
        return contribution.observation

    meta = contribution.metadata or {}
    category = meta.get('observation_category') or ''
    if category not in {k for k, _ in OBSERVATION_CATEGORY_CHOICES}:
        category = 'other' if _has_content(contribution) else ''

    # No text and no photo means nothing to show: 607 of the 608 legacy
    # observation rows are empty spreadsheet imports. A photo-only
    # observation is still meaningful, so media counts as content here.
    if not _has_content(contribution) and not contribution.media.exists():
        return None

    image = _first_image(contribution)
    return Observation.objects.create(
        contribution=contribution,
        observation_category=category,
        organism_name=str(meta.get('organism_name') or '').strip(),
        photo=image.file if image else None,
    )


def _ensure_event(contribution):
    """Materialise a ``community.Event`` for event / beach_cleanup submissions.

    ``Event.organizer`` is NOT NULL and the wizard has no organiser field for
    the contributor themselves, so the contributor becomes the organiser;
    ``start_date`` is likewise NOT NULL, so a missing ``event_date`` falls back
    to the submission timestamp rather than failing the whole publish.
    """
    from django.utils import timezone
    from community.models import Event

    if hasattr(contribution, 'event'):
        return contribution.event

    meta = contribution.metadata or {}
    valid_types = {k for k, _ in Event.TYPE_CHOICES}
    event_type = str(meta.get('event_type') or '').strip()
    if event_type not in valid_types:
        # 'event' has no type field in the wizard; beach cleanups always
        # count as event_type='cleanup' for analytics/views.py's counter.
        event_type = 'cleanup' if contribution.type == 'beach_cleanup' else 'community_meeting'

    title = (contribution.title or '').strip() or (contribution.notes or '').strip() or 'Community event'
    description = contribution.description or contribution.notes or ''
    start_date = _coerce_start(meta.get('event_date'), contribution.created_at or timezone.now())
    image = _first_image(contribution)

    return Event.objects.create(
        title=title[:300],
        description=description,
        event_type=event_type,
        organizer=contribution.user,
        contribution=contribution,
        location=contribution.location,
        location_name=str(meta.get('venue') or '')[:200],
        village=contribution.village,
        start_date=start_date,
        max_participants=_coerce_int(meta.get('expected_participants'), 0) or None,
        is_published=True,
        photo=image.file if image else None,
    )


def _ensure_beach_cleanup(contribution):
    """Create the Event(type='cleanup') plus a linked BeachCleanupEvent.

    Both are needed: analytics/views.py counts cleanups off Event, while the
    ecotourism storefront reads BeachCleanupEvent.
    """
    from django.utils import timezone
    from ecotourism.models import BeachCleanupEvent

    if hasattr(contribution, 'beach_cleanup'):
        return contribution.beach_cleanup

    event = _ensure_event(contribution)
    meta = contribution.metadata or {}
    title = (contribution.title or '').strip() or (contribution.notes or '').strip() or 'Beach cleanup'
    description = contribution.description or contribution.notes or ''
    waste_types = str(meta.get('waste_types') or '').strip()
    if waste_types:
        description = f'{description}\n\nWaste collected: {waste_types}' if description else f'Waste collected: {waste_types}'

    return BeachCleanupEvent.objects.create(
        beach=None,
        event=event,
        contribution=contribution,
        title=title[:300],
        description=description,
        cleanup_date=_coerce_day(meta.get('cleanup_date'), (contribution.created_at or timezone.now()).date()),
        participants_count=_coerce_int(meta.get('participants_count'), 0),
        waste_collected_kg=_coerce_float(meta.get('waste_weight_kg')) or 0,
        photos_count=contribution.media.filter(kind='image').count(),
        organized_by=contribution.user,
    )


def publish_contribution(contribution):
    """Mark a contribution publicly visible and materialise child records.

    Idempotent: safe to call on an already-verified contribution to re-create
    any missing module child rows (used by re-approve and the backfill command).
    """
    from django.utils import timezone

    contribution.status = 'verified'
    if not contribution.verified_at:
        contribution.verified_at = timezone.now()
    contribution.moderation_decision = 'APPROVED'
    contribution.visibility_status = 'COMMUNITY_VISIBLE'
    contribution.save()
    child = create_child_records(contribution)
    return child


def unpublish_contribution(contribution, reason=''):
    contribution.status = 'rejected'
    contribution.moderation_decision = 'REJECTED'
    contribution.visibility_status = 'PRIVATE'
    if reason:
        contribution.rejection_reason = reason[:200]
    contribution.save()
    _remove_child_records(contribution)
    return contribution


def withdraw_contribution(contribution):
    """Un-publish without touching the review decision.

    Used when an admin demotes a verified row to another workflow status
    (e.g. verified -> moderator_review). Unlike unpublish_contribution() this
    leaves status / moderation_decision / rejection_reason exactly as the
    admin set them — it only hides the content and drops the module children.
    """
    contribution.visibility_status = 'PRIVATE'
    contribution.save()
    _remove_child_records(contribution)
    return contribution


def _remove_child_records(contribution):
    """Delete module child rows so rejected content leaves public galleries.

    The canonical content always remains on the Contribution itself; these
    mirrors are re-created by publish_contribution() if the item is re-approved.
    """
    if contribution.type == 'marine_sighting':
        _delete_related(contribution, 'marine_sighting')
    elif contribution.type == 'ocean_sound':
        _delete_related(contribution, 'ocean_sound')
        _delete_related(contribution, 'sound_item')
    elif contribution.type == 'education_post':
        _delete_related(contribution, 'education_post')
    elif contribution.type == 'local_knowledge':
        _delete_related(contribution, 'guide_species')
    elif contribution.type == 'fish_catch':
        _delete_related(contribution, 'fish_catch')
    elif contribution.type == 'observation':
        _delete_related(contribution, 'observation')
    elif contribution.type == 'event':
        _delete_related(contribution, 'event')
    elif contribution.type == 'beach_cleanup':
        # BeachCleanupEvent.event is SET_NULL, so dropping the cleanup first
        # keeps the pair consistent before the shared Event goes away.
        _delete_related(contribution, 'beach_cleanup')
        _delete_related(contribution, 'event')


def _delete_related(contribution, accessor):
    try:
        getattr(contribution, accessor).delete()
    except Exception:
        pass
