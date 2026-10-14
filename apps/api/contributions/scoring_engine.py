from django.db.models import Q, Count, Sum, Avg, F
from django.utils import timezone
from datetime import timedelta
from .models import Contribution, ContributionType


DEFAULT_WEIGHTS = {
    'quantity': 0.20,
    'quality': 0.25,
    'verification': 0.20,
    'community': 0.10,
    'environmental': 0.10,
    'knowledge': 0.10,
    'events': 0.05,
}

MAX_SCORE = 100


def get_scoring_weights():
    from django.conf import settings
    return getattr(settings, 'SCORING_WEIGHTS', DEFAULT_WEIGHTS)


def calculate_quantity_score(user, period_days=365):
    cutoff = timezone.now() - timedelta(days=period_days)
    total = Contribution.objects.filter(
        user=user,
        created_at__gte=cutoff,
    ).count()

    return min(total / 100, 1.0) * MAX_SCORE


def calculate_quality_score(user, period_days=365):
    cutoff = timezone.now() - timedelta(days=period_days)
    contributions = Contribution.objects.filter(
        user=user,
        created_at__gte=cutoff,
        status__in=['verified', 'auto_validated'],
    )

    if not contributions.exists():
        return 0

    scores = []
    for c in contributions:
        completeness = 0
        total_fields = 5

        if c.notes:
            completeness += 1
        if c.location:
            completeness += 1
        if c.metadata:
            completeness += 1
        if c.village:
            completeness += 1
        if c.quality_score > 0:
            completeness += 1

        scores.append(completeness / total_fields)

    avg_quality = sum(scores) / len(scores)
    return avg_quality * MAX_SCORE


def calculate_verification_score(user, period_days=365):
    cutoff = timezone.now() - timedelta(days=period_days)
    total = Contribution.objects.filter(
        user=user,
        created_at__gte=cutoff,
    ).count()

    if total == 0:
        return 0

    verified = Contribution.objects.filter(
        user=user,
        created_at__gte=cutoff,
        status='verified',
    ).count()

    return (verified / total) * MAX_SCORE


def calculate_community_score(user, period_days=365):
    from community.models import CommunityPost, EventParticipant

    cutoff = timezone.now() - timedelta(days=period_days)

    posts = CommunityPost.objects.filter(
        author=user,
        created_at__gte=cutoff,
    ).count()

    events = EventParticipant.objects.filter(
        user=user,
        registered_at__gte=cutoff,
        status='attended',
    ).count()

    total = posts + (events * 2)
    return min(total / 50, 1.0) * MAX_SCORE


def calculate_environmental_score(user, period_days=365):
    cutoff = timezone.now() - timedelta(days=period_days)

    environmental_types = ['marine_sighting', 'beach_cleanup', 'observation']
    count = Contribution.objects.filter(
        user=user,
        created_at__gte=cutoff,
        type__in=environmental_types,
        status='verified',
    ).count()

    return min(count / 30, 1.0) * MAX_SCORE


def calculate_knowledge_score(user, period_days=365):
    from education.models import EducationPost

    cutoff = timezone.now() - timedelta(days=period_days)

    education_posts = EducationPost.objects.filter(
        author=user,
        created_at__gte=cutoff,
        published=True,
    ).count()

    total = education_posts
    return min(total / 20, 1.0) * MAX_SCORE


def calculate_event_score(user, period_days=365):
    from community.models import EventParticipant

    cutoff = timezone.now() - timedelta(days=period_days)

    attended = EventParticipant.objects.filter(
        user=user,
        registered_at__gte=cutoff,
        status='attended',
    ).count()

    organized = EventParticipant.objects.filter(
        event__organizer=user,
        registered_at__gte=cutoff,
    ).count()

    total = attended + (organized * 3)
    return min(total / 25, 1.0) * MAX_SCORE


def calculate_total_score(user):
    weights = get_scoring_weights()

    scores = {
        'quantity': calculate_quantity_score(user),
        'quality': calculate_quality_score(user),
        'verification': calculate_verification_score(user),
        'community': calculate_community_score(user),
        'environmental': calculate_environmental_score(user),
        'knowledge': calculate_knowledge_score(user),
        'events': calculate_event_score(user),
    }

    total = sum(scores[key] * weights.get(key, 0) for key in scores)

    return {
        'total': round(total, 2),
        'breakdown': {k: round(v, 2) for k, v in scores.items()},
    }


def update_user_score(user):
    from recognition.models import ContributionScore

    result = calculate_total_score(user)

    score, created = ContributionScore.objects.update_or_create(
        user=user,
        defaults={
            'total_score': int(result['total']),
            'verified_contributions': Contribution.objects.filter(
                user=user, status='verified'
            ).count(),
            'total_contributions': Contribution.objects.filter(user=user).count(),
            'quality_average': result['breakdown']['quality'],
            'last_calculated': timezone.now(),
        },
    )

    from accounts.models import Profile
    Profile.objects.filter(user=user).update(contribution_score=int(result['total']))

    return result


def bulk_update_scores(user_ids=None):
    if user_ids:
        from accounts.models import User
        users = User.objects.filter(id__in=user_ids)
    else:
        from accounts.models import User
        users = User.objects.filter(is_active=True)

    updated = 0
    for user in users:
        try:
            update_user_score(user)
            updated += 1
        except Exception as e:
            print(f"Error updating score for {user.username}: {e}")

    return updated
