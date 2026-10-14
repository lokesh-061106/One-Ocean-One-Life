from django.db.models import Q
from .models import User, Profile


def get_visible_fields(viewer, profile_owner):
    if viewer == profile_owner:
        return 'private'

    if viewer.role in ('SUPER_ADMIN', 'ADMIN', 'MODERATOR'):
        return 'admin'

    return 'members'


def get_public_profile(profile):
    return {
        'id': str(profile.id),
        'user': {
            'id': str(profile.user.id),
            'first_name': profile.user.first_name,
            'last_name': profile.user.last_name,
        },
        'photo': profile.photo.url if profile.photo else None,
        'village': profile.village.name if profile.village else None,
        'occupation': profile.occupation,
        'location_precision': profile.location_precision,
        'contribution_score': profile.contribution_score,
        'member_status': profile.member_status,
    }


def get_gps_display(profile, viewer):
    if viewer == profile.user:
        return {
            'latitude': profile.latitude,
            'longitude': profile.longitude,
            'precision': 'exact',
        }

    if viewer.role in ('SUPER_ADMIN', 'ADMIN'):
        return {
            'latitude': profile.latitude,
            'longitude': profile.longitude,
            'precision': profile.location_precision,
        }

    if profile.location_precision == 'exact':
        if viewer.role == 'SCIENTIFIC_VALIDATOR':
            return {
                'latitude': profile.latitude,
                'longitude': profile.longitude,
                'precision': 'approximate',
            }
        return None

    if profile.location_precision == 'approximate':
        if viewer.role in ('RESEARCHER', 'SCIENTIFIC_VALIDATOR'):
            return {
                'latitude': profile.latitude,
                'longitude': profile.longitude,
                'precision': 'approximate',
            }
        return None

    if profile.location_precision == 'village':
        if profile.village:
            return {
                'latitude': profile.village.latitude,
                'longitude': profile.village.longitude,
                'precision': 'village',
            }
        return None

    if profile.location_precision == 'district':
        if profile.village and profile.village.district:
            return {
                'latitude': None,
                'longitude': None,
                'precision': 'district',
                'district': profile.village.district.name,
            }
        return None

    return None


def filter_profile_for_viewer(profile, viewer):
    visibility = get_visible_fields(viewer, profile.user)

    data = {
        'id': str(profile.id),
        'user': {
            'id': str(profile.user.id),
            'first_name': profile.user.first_name,
            'last_name': profile.user.last_name,
        },
        'photo': profile.photo.url if profile.photo else None,
        'village': profile.village.name if profile.village else None,
        'occupation': profile.occupation,
        'location_precision': profile.location_precision,
        'contribution_score': profile.contribution_score,
        'member_status': profile.member_status,
    }

    if visibility in ('members', 'private', 'admin'):
        data['organization'] = profile.organization
        data['bio'] = profile.bio
        data['last_active_at'] = profile.last_active_at.isoformat() if profile.last_active_at else None

    if visibility == 'private':
        data['latitude'] = profile.latitude
        data['longitude'] = profile.longitude
        data['user']['email'] = profile.user.email
        data['user']['phone'] = profile.user.phone
        data['total_contributions'] = profile.total_contributions
        data['total_verified'] = profile.total_verified
        data['total_events'] = profile.total_events

    if visibility == 'admin':
        data['latitude'] = profile.latitude
        data['longitude'] = profile.longitude
        data['user']['email'] = profile.user.email
        data['user']['phone'] = profile.user.phone
        data['user']['role'] = profile.user.role
        data['user']['is_verified'] = profile.user.is_verified
        data['user']['date_joined'] = profile.user.date_joined.isoformat()
        data['total_contributions'] = profile.total_contributions
        data['total_verified'] = profile.total_verified
        data['total_events'] = profile.total_events

    return data


def check_age_restriction(user):
    if user.date_of_birth:
        return user.age_verified
    return True
