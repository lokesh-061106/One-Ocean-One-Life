"""Per-contribution-type schemas: metadata validation + submission wizard config.

One declarative definition drives three things:
  * server-side validation of ``Contribution.metadata`` (``validate_metadata``)
  * ``GET /api/v1/contributions/wizard-config/`` (``build_wizard_config``)
  * publish-time mirroring into module models (``contributions.publishing``)

Cross-module imports are done lazily inside functions so this module stays
import-safe from anywhere (serializers, views, management commands).
"""

from datetime import date

from django.core.exceptions import ValidationError

from core.choices import CONTRIBUTOR_TYPE_CHOICES

# --------------------------------------------------------------------------- #
# Enumerations used by the wizard chips/dropdowns
# --------------------------------------------------------------------------- #

INSTRUMENT_CHOICES = [
    ('hydrophone', 'Hydrophone'),
    ('recorder', 'Recorder'),
    ('smartphone', 'Smartphone'),
    ('autonomous_recorder', 'Autonomous recorder'),
    ('other', 'Other'),
]

RECORDING_ENVIRONMENT_CHOICES = [
    ('coastal', 'Coastal'),
    ('estuary', 'Estuary'),
    ('offshore', 'Offshore'),
    ('deep_sea', 'Deep sea'),
    ('harbour', 'Harbour'),
    ('fishing_ground', 'Fishing ground'),
    ('other', 'Other'),
]

SPECIES_LEVEL_CHOICES = [
    ('known', 'I know the species'),
    ('approximate', 'I know approximately'),
    ('unknown', "I don't know"),
]

SPECIES_GROUP_CHOICES = [
    ('dolphin', 'Dolphin'),
    ('whale', 'Whale'),
    ('shark', 'Shark'),
    ('turtle', 'Turtle'),
    ('ray', 'Ray'),
    ('fish', 'Fish'),
    ('seabird', 'Seabird'),
    ('crustacean', 'Crustacean'),
    ('other', 'Other'),
]

BEHAVIOUR_CHOICES = [
    ('traveling', 'Traveling'),
    ('feeding', 'Feeding'),
    ('resting', 'Resting'),
    ('playing', 'Playing'),
    ('breeding', 'Breeding'),
    ('breaching', 'Breaching'),
    ('socializing', 'Socializing'),
    ('hunting', 'Hunting'),
    ('unknown', 'Unknown'),
]

SEA_CONDITION_CHOICES = [
    ('calm', 'Calm'),
    ('slight', 'Slight'),
    ('moderate', 'Moderate'),
    ('rough', 'Rough'),
    ('very_rough', 'Very rough'),
    ('stormy', 'Stormy'),
    ('unknown', 'Unknown'),
]

WEATHER_CHOICES = [
    ('sunny', 'Sunny'),
    ('cloudy', 'Cloudy'),
    ('rainy', 'Rainy'),
    ('stormy', 'Stormy'),
    ('foggy', 'Foggy'),
    ('unknown', 'Unknown'),
]

GEAR_CHOICES = [
    ('gillnet', 'Gill net'),
    ('trawl', 'Trawl net'),
    ('longline', 'Longline'),
    ('handline', 'Handline / hook'),
    ('cast_net', 'Cast net'),
    ('seine', 'Seine net'),
    ('trap', 'Trap / pot'),
    ('spear', 'Spear'),
    ('other', 'Other'),
]

OBSERVATION_CATEGORY_CHOICES = [
    ('animal', 'Animal'),
    ('plant', 'Plant / algae'),
    ('pollution', 'Pollution'),
    ('debris', 'Marine debris'),
    ('habitat', 'Habitat'),
    ('other', 'Other'),
]

KNOWLEDGE_TYPE_CHOICES = [
    ('traditional', 'Traditional knowledge'),
    ('ecological', 'Ecological knowledge'),
    ('fishing_practice', 'Fishing practice'),
    ('other', 'Other'),
]

# --------------------------------------------------------------------------- #
# Media input field names accepted by the create/update serializers
# (kind/role pairing lives in serializers.MEDIA_INPUT_MAP)
# --------------------------------------------------------------------------- #

MEDIA_INPUT_FIELDS = (
    'images', 'location_photo', 'setup_images', 'species_images', 'spectrogram',
    'video', 'audio', 'voice_note', 'documents',
)

# Contribution types whose submissions must carry a GPS point.
GEOTAG_REQUIRED_TYPES = {'ocean_sound', 'marine_sighting', 'fish_catch'}

# Per-type hard media rules enforced on submit (never on drafts):
#   required — field must carry at least one file
#   any_of  — at least one of the listed fields must carry a file
MEDIA_REQUIREMENTS = {
    'ocean_sound': {'required': ['audio'], 'any_of': []},
    'marine_sighting': {'required': [], 'any_of': ['images', 'video']},
    'fish_catch': {'required': [], 'any_of': ['images', 'video']},
}

# --------------------------------------------------------------------------- #
# Field schema helpers
# --------------------------------------------------------------------------- #

def _f(key, label, type='string', required=False, choices=None, section='details',
       help='', **extra):
    field = {
        'key': key, 'label': label, 'type': type, 'required': required,
        'section': section, 'help': help,
    }
    if choices:
        field['choices'] = [{'value': v, 'label': lbl} for v, lbl in choices]
    field.update(extra)
    return field


def _species_fields(section='species'):
    """The shared 3-level species identification block."""
    return [
        _f('species_level', 'Species identification', type='choice',
           choices=SPECIES_LEVEL_CHOICES, section=section,
           help='Tell us how confident you are — O3L experts can identify it for you.'),
        _f('species_name', 'Species', section=section,
           help='Shown when "I know the species" is selected.'),
        _f('species_guide_id', 'Species id', section=section,
           help='Reference to the O3L species guide entry.'),
        _f('species_group', 'Species group', type='choice',
           choices=SPECIES_GROUP_CHOICES, section=section,
           help='Shown when "I know approximately" is selected.'),
    ]


SOUND_RESEARCH_FIELDS = [
    _f('instrument', 'Instrument', type='choice', choices=INSTRUMENT_CHOICES,
       section='research', help='Device used to capture the recording.'),
    _f('instrument_model', 'Instrument model', section='research',
       help='e.g. SoundTrap ST600, Zoom H5'),
    _f('sampling_rate', 'Sampling rate', section='research',
       help='e.g. 48000 Hz'),
    _f('recording_duration', 'Recording duration', section='research',
       help='e.g. 5 min 12 s (auto-detected when possible)'),
    _f('depth_m', 'Depth (m)', type='float', min=0, section='research',
       help='Hydrophone / recorder depth in metres.'),
    _f('recording_environment', 'Recording environment', type='choice',
       choices=RECORDING_ENVIRONMENT_CHOICES, section='research'),
    _f('recording_environment_other', 'Recording environment (other)', section='research'),
    _f('recording_method', 'Recording method', section='research',
       help='e.g. fixed buoy, handheld from boat, towed array'),
    _f('calibration_info', 'Calibration information', type='text', section='research',
       help='Calibration date, reference level, sensitivity settings.'),
]

# Mirrors the Django admin "Add sound item" form (SoundItemAdmin).
# Category choices are injected live in build_wizard_config(). Slug is
# optional (auto-generated from Name when blank); sort_order defaults to 0.
SOUND_ITEM_FIELDS = [
    _f('sound_category', 'Category', type='choice', required=True,
       help='Library category this recording belongs to.'),
    _f('slug', 'Slug',
       help='URL slug for the library entry. Auto-generated from Name if left blank.'),
    _f('sort_order', 'Sort order', type='integer', min=0,
       help='Order in the sound library (0 = default).'),
    _f('source', 'Source', help='e.g. NOAA 2023, personal recording, field survey'),
    _f('document_name', 'Document name',
       help='Display name for the attached document. Leave blank to use the file name.'),
]

SIGHTING_FIELDS = _species_fields() + [
    _f('individuals', 'Number of individuals', type='integer', min=1,
       help='How many animals did you see?'),
    _f('behaviour', 'Behaviour', type='choice', choices=BEHAVIOUR_CHOICES),
    _f('approximate_size', 'Approximate size', help='e.g. 2.5 – 3 m'),
    _f('water_depth_m', 'Water depth (m)', type='float', min=0),
    _f('sea_condition', 'Sea condition', type='choice', choices=SEA_CONDITION_CHOICES),
    _f('weather', 'Weather', type='choice', choices=WEATHER_CHOICES),
]

FISH_CATCH_FIELDS = _species_fields() + [
    _f('number', 'Number caught', type='integer', min=1, section='catch'),
    _f('weight', 'Weight', type='float', min=0, section='catch'),
    _f('weight_unit', 'Weight unit', type='choice',
       choices=[('kg', 'kg'), ('g', 'g')], section='catch'),
    _f('length', 'Length', type='float', min=0, section='catch'),
    _f('length_unit', 'Length unit', type='choice',
       choices=[('cm', 'cm'), ('m', 'm')], section='catch'),
    _f('gear', 'Gear', type='choice', choices=GEAR_CHOICES, section='catch'),
    _f('gear_other', 'Gear details', section='catch',
       help='Describe the gear when "Other" is selected.'),
    _f('depth_m', 'Fishing depth (m)', type='float', min=0, section='catch'),
    _f('fishing_location_name', 'Fishing location', section='catch',
       help='Named grounds or landmarks, e.g. "Palk Bay sandbank".'),
]

OBSERVATION_FIELDS = [
    _f('observation_category', 'What did you observe?', type='choice',
       choices=OBSERVATION_CATEGORY_CHOICES),
    _f('organism_name', 'Organism / subject', help='Species or subject of the observation.'),
]

EVENT_FIELDS = [
    _f('event_date', 'Event date', type='date', required=True, section='event'),
    _f('venue', 'Venue', section='event'),
    _f('organiser', 'Organiser', section='event'),
    _f('expected_participants', 'Expected participants', type='integer', min=0, section='event'),
]

BEACH_CLEANUP_FIELDS = [
    _f('cleanup_date', 'Cleanup date', type='date', section='event'),
    _f('participants_count', 'Participants', type='integer', min=0, section='event'),
    _f('waste_weight_kg', 'Waste collected (kg)', type='float', min=0, section='event'),
    _f('organising_body', 'Organising body', section='event'),
    _f('waste_types', 'Types of waste', section='event',
       help='e.g. plastic bottles, fishing nets, glass'),
]

LOCAL_KNOWLEDGE_FIELDS = [
    _f('topic', 'Topic', section='knowledge'),
    _f('related_species', 'Related species / fishery', section='knowledge'),
    _f('knowledge_type', 'Knowledge type', type='choice',
       choices=KNOWLEDGE_TYPE_CHOICES, section='knowledge'),
]

EDUCATION_POST_FIELDS = [
    _f('topic', 'Topic', section='details'),
    _f('audience', 'Audience', section='details',
       help='e.g. school students, fishing community, general public'),
]

# --------------------------------------------------------------------------- #
# Wizard configuration (drives web + mobile forms)
# --------------------------------------------------------------------------- #

TYPE_CONFIG = {
    'ocean_sound': {
        'label': 'Ocean Sound',
        'primary': True,
        'description': 'Share an underwater recording — hydrophone, boat or phone.',
        'icon': 'audio-lines',
        'optional_media': ['location_photo', 'setup_images', 'species_images', 'video',
                           'voice_note', 'documents', 'spectrogram'],
        'text_fields': [
            {'key': 'description', 'label': 'Description', 'required': False},
        ],
        'fields': SOUND_ITEM_FIELDS + SOUND_RESEARCH_FIELDS,
    },
    'marine_sighting': {
        'label': 'Marine Species Sighting',
        'primary': True,
        'description': 'Report a dolphin, whale, turtle, shark or any marine species.',
        'icon': 'binoculars',
        'optional_media': ['images', 'voice_note', 'documents'],
        'text_fields': [
            {'key': 'notes', 'label': 'Additional message', 'required': False},
        ],
        'fields': SIGHTING_FIELDS,
    },
    'fish_catch': {
        'label': 'Fish Catch',
        'primary': True,
        'description': 'Log your catch with photos, size, weight and gear details.',
        'icon': 'fish',
        'optional_media': ['images', 'voice_note', 'documents'],
        'text_fields': [
            {'key': 'notes', 'label': 'Additional message', 'required': False},
        ],
        'fields': FISH_CATCH_FIELDS,
    },
    'observation': {
        'label': 'Observation',
        'primary': False,
        'description': 'Any ocean or coastal observation worth recording.',
        'icon': 'eye',
        'optional_media': ['images', 'video', 'voice_note', 'documents'],
        'text_fields': [
            {'key': 'notes', 'label': 'Notes', 'required': False},
        ],
        'fields': OBSERVATION_FIELDS,
    },
    'education_post': {
        'label': 'Education Post',
        'primary': False,
        'description': 'Share knowledge, awareness material or a classroom story.',
        'icon': 'book-open',
        'optional_media': ['images', 'video', 'documents'],
        'text_fields': [
            {'key': 'notes', 'label': 'Summary', 'required': False},
            {'key': 'description', 'label': 'Article (rich text)', 'required': False},
        ],
        'fields': EDUCATION_POST_FIELDS,
    },
    'event': {
        'label': 'Event',
        'primary': False,
        'description': 'Announce a beach walk, workshop, rally or meetup.',
        'icon': 'calendar',
        'optional_media': ['images', 'video', 'documents'],
        'text_fields': [
            {'key': 'notes', 'label': 'Event details', 'required': False},
        ],
        'fields': EVENT_FIELDS,
    },
    'beach_cleanup': {
        'label': 'Beach Cleanup',
        'primary': False,
        'description': 'Record a cleanup drive — date, photos and waste details.',
        'icon': 'trash-2',
        'optional_media': ['images', 'video', 'voice_note', 'documents'],
        'text_fields': [
            {'key': 'notes', 'label': 'Cleanup notes', 'required': False},
        ],
        'fields': BEACH_CLEANUP_FIELDS,
    },
    'local_knowledge': {
        'label': 'Local Knowledge',
        'primary': False,
        'description': 'Traditional ecological and fishing knowledge from your coast.',
        'icon': 'scroll',
        'optional_media': ['images', 'audio', 'voice_note', 'documents'],
        'text_fields': [
            {'key': 'notes', 'label': 'Knowledge note', 'required': False},
            {'key': 'description', 'label': 'Full description (rich text)', 'required': False},
        ],
        'fields': LOCAL_KNOWLEDGE_FIELDS,
    },
}

MEDIA_FIELD_LABELS = {
    'images': 'Photos',
    'location_photo': 'Location photo',
    'setup_images': 'Recording setup photo',
    'species_images': 'Species photo',
    'spectrogram': 'Spectrogram file',
    'video': 'Video',
    'audio': 'Audio file',
    'voice_note': 'Voice note',
    'documents': 'Documents',
}


def _media_section(ctype):
    rules = MEDIA_REQUIREMENTS.get(ctype, {'required': [], 'any_of': []})
    cfg = TYPE_CONFIG[ctype]
    required = [
        {'field': f, 'label': MEDIA_FIELD_LABELS.get(f, f)}
        for f in rules['required']
    ]
    any_of = [
        {'field': f, 'label': MEDIA_FIELD_LABELS.get(f, f)}
        for f in rules['any_of']
    ]
    optional = [
        {'field': f, 'label': MEDIA_FIELD_LABELS.get(f, f)}
        for f in cfg['optional_media']
    ]
    return {'required': required, 'any_of': any_of, 'optional': optional}


def _sound_category_choices():
    """Live SoundCategory choices for the wizard (value = slug)."""
    try:
        from ocean_sounds.models import SoundCategory
    except Exception:  # app not loaded (e.g. during partial installs)
        return []
    choices = []
    qs = SoundCategory.objects.order_by('sort_order', 'name')
    parents = {c.pk: c.name for c in qs.filter(parent__isnull=True)}
    for cat in qs:
        label = cat.name
        if cat.parent_id and cat.parent_id in parents:
            label = f'{parents[cat.parent_id]} / {cat.name}'
        choices.append({'value': cat.slug, 'label': label})
    return choices


def build_wizard_config():
    """Full submission-wizard definition served to web and mobile clients."""
    from .models import Contribution  # local import: avoid app-load cycle

    sound_category_choices = _sound_category_choices()
    types = []
    for value, label in Contribution.TYPE_CHOICES:
        cfg = TYPE_CONFIG.get(value, {})
        fields = cfg.get('fields', [])
        if value == 'ocean_sound' and sound_category_choices:
            fields = [
                {**f, 'choices': sound_category_choices} if f['key'] == 'sound_category' else f
                for f in fields
            ]
        types.append({
            'value': value,
            'label': cfg.get('label', label),
            'primary': cfg.get('primary', False),
            'description': cfg.get('description', ''),
            'icon': cfg.get('icon', 'file'),
            'requires_geotag': value in GEOTAG_REQUIRED_TYPES,
            'media': _media_section(value),
            'text_fields': cfg.get('text_fields', []),
            'fields': fields,
        })
    return {
        'contributor_types': [
            {'value': v, 'label': lbl} for v, lbl in CONTRIBUTOR_TYPE_CHOICES
        ],
        'species_groups': [{'value': v, 'label': lbl} for v, lbl in SPECIES_GROUP_CHOICES],
        'types': types,
    }


# --------------------------------------------------------------------------- #
# Metadata validation
# --------------------------------------------------------------------------- #

def _clean_choice(value, field):
    if value in (None, ''):
        return None
    text = str(value).strip()
    if not text:
        return None
    live = _live_choices_for(field.get('key'))
    if live is not None:
        if not live:
            # No rows yet (fresh install / empty test DB) — accept the value;
            # publish falls back to a default category.
            return text
        valid = {v for v, _ in live}
    else:
        valid = {c[0] for c in _choices_for(field)}
    if text not in valid:
        raise ValidationError(
            f"{field['label']}: '{text}' is not one of "
            f"{', '.join(sorted(valid))}."
        )
    return text


def _choices_for(field):
    """Choice tuples for a schema field declared with dict choices."""
    return [
        (c['value'], c['label']) if isinstance(c, dict) else c
        for c in field.get('choices', [])
    ]


def _live_choices_for(key):
    """Dynamic (database-backed) choices for keys that can't be static."""
    if key == 'sound_category':
        return [(c['value'], c['label']) for c in _sound_category_choices()]
    return None


def _clean_string(value, field):
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    max_length = field.get('max_length', 500)
    if len(text) > max_length:
        raise ValidationError(
            f"{field['label']} must be at most {max_length} characters."
        )
    return text


def _clean_number(value, field, integer=False):
    if value in (None, ''):
        return None
    try:
        number = int(str(value).strip()) if integer else float(str(value).strip())
    except (TypeError, ValueError):
        raise ValidationError(f"{field['label']} must be a number.")
    if field.get('min') is not None and number < field['min']:
        raise ValidationError(f"{field['label']} must be at least {field['min']}.")
    if field.get('max') is not None and number > field['max']:
        raise ValidationError(f"{field['label']} must be at most {field['max']}.")
    return number


def _clean_date(value, field):
    if value in (None, ''):
        return None
    if isinstance(value, date):
        return value.isoformat()
    text = str(value).strip()
    try:
        return date.fromisoformat(text).isoformat()
    except ValueError:
        raise ValidationError(f"{field['label']} must be a date in YYYY-MM-DD format.")


def _clean_boolean(value):
    if value in (None, ''):
        return None
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in ('true', '1', 'yes'):
        return True
    if text in ('false', '0', 'no'):
        return False
    raise ValidationError('Boolean value expected.')


def _validate_species_block(metadata, fields_by_key, require):
    """Cross-field rules for the shared 3-level species identification."""
    level = metadata.get('species_level')
    if not level:
        if require and 'species_level' in fields_by_key and require('species_level'):
            raise ValidationError('Species identification level is required.')
        return

    if level == 'known' and not metadata.get('species_name'):
        raise ValidationError('species_name is required when the species is known.')
    if level == 'approximate' and not metadata.get('species_group'):
        raise ValidationError('species_group is required for an approximate identification.')
    if level == 'unknown':
        metadata['needs_expert_id'] = True
    else:
        metadata.pop('needs_expert_id', None)


def validate_metadata(contribution_type, metadata, require_fields=True):
    """Validate and normalise metadata for a contribution type.

    Returns a new dict. Unknown keys are preserved untouched so legacy
    payloads (imports, module-specific writers) survive round-trips.
    Raises ``django.core.exceptions.ValidationError`` on bad input.
    """
    from .models import Contribution  # local import: avoid app-load cycle

    if metadata in (None, ''):
        metadata = {}
    if not isinstance(metadata, dict):
        raise ValidationError('metadata must be a JSON object.')

    if contribution_type not in {k for k, _ in Contribution.TYPE_CHOICES}:
        # type validated elsewhere; nothing schema-specific to check
        return dict(metadata)

    cfg = TYPE_CONFIG.get(contribution_type, {})
    schema_fields = cfg.get('fields', [])
    fields_by_key = {f['key']: f for f in schema_fields}

    cleaned = dict(metadata)  # preserve unknown keys
    for field in schema_fields:
        key = field['key']
        if key not in metadata:
            continue
        value = metadata[key]
        ftype = field['type']
        if ftype == 'choice':
            out = _clean_choice(value, field)
        elif ftype == 'integer':
            out = _clean_number(value, field, integer=True)
        elif ftype == 'float':
            out = _clean_number(value, field)
        elif ftype == 'date':
            out = _clean_date(value, field)
        elif ftype == 'boolean':
            out = _clean_boolean(value)
        elif ftype in ('text', 'string'):
            out = _clean_string(value, field)
        else:
            out = value
        if out is None:
            cleaned.pop(key, None)
        else:
            cleaned[key] = out

    # Required metadata fields (never enforced for drafts — caller sets the flag)
    if require_fields:
        for field in schema_fields:
            if field.get('required') and not cleaned.get(field['key']):
                raise ValidationError(f"{field['label']} is required.")

    if 'species_level' in fields_by_key:
        def require(field_key):
            field = fields_by_key.get(field_key, {})
            return bool(field.get('required')) and require_fields

        _validate_species_block(cleaned, fields_by_key, require)

    return cleaned


def validate_media_requirements(contribution_type, has_field):
    """Check hard media rules. ``has_field(name) -> bool`` reports file presence.

    Raises ``ValidationError`` when a required media input is missing.
    """
    rules = MEDIA_REQUIREMENTS.get(contribution_type)
    if not rules:
        return
    for field in rules['required']:
        if not has_field(field):
            raise ValidationError(
                f"{MEDIA_FIELD_LABELS.get(field, field)} is required for this "
                "contribution type."
            )
    if rules['any_of'] and not any(has_field(f) for f in rules['any_of']):
        labels = ' or '.join(MEDIA_FIELD_LABELS.get(f, f) for f in rules['any_of'])
        raise ValidationError(f'{labels} is required for this contribution type.')


def geotag_required(contribution_type):
    return contribution_type in GEOTAG_REQUIRED_TYPES


def has_required_metadata(contribution_type):
    """True when the type declares at least one required metadata field."""
    cfg = TYPE_CONFIG.get(contribution_type, {})
    return any(f.get('required') for f in cfg.get('fields', []))
