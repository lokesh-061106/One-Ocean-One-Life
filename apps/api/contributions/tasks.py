from celery import shared_task
from django.utils import timezone


@shared_task
def update_user_score_task(user_id):
    try:
        from accounts.models import User
        from .scoring_engine import update_user_score

        user = User.objects.get(id=user_id)
        result = update_user_score(user)

        return {
            'status': 'completed',
            'user_id': str(user_id),
            'total_score': result['total'],
        }
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
        }


@shared_task
def bulk_update_scores_task(user_ids=None):
    try:
        from .scoring_engine import bulk_update_scores

        updated = bulk_update_scores(user_ids)

        return {
            'status': 'completed',
            'updated': updated,
        }
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
        }


@shared_task
def auto_validate_contributions():
    try:
        from .models import Contribution
        from .verification import auto_validate

        submitted = Contribution.objects.filter(status='submitted')
        validated = 0

        for contribution in submitted:
            if auto_validate(contribution):
                validated += 1

        return {
            'status': 'completed',
            'validated': validated,
        }
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
        }


@shared_task
def send_verification_reminders():
    try:
        from .models import Contribution
        from notifications.tasks import send_notification_by_type_task

        pending = Contribution.objects.filter(
            status__in=['submitted', 'auto_validated'],
            created_at__lt=timezone.now() - timezone.timedelta(days=3),
        )

        from django.contrib.auth import get_user_model
        User = get_user_model()

        moderators = User.objects.filter(
            role__in=['MODERATOR', 'SCIENTIFIC_VALIDATOR'],
            is_active=True,
        )

        for moderator in moderators:
            send_notification_by_type_task.delay(
                str(moderator.id),
                'verification_reminder',
                {'pending_count': pending.count()},
            )

        return {
            'status': 'completed',
            'reminders_sent': moderators.count(),
        }
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
        }


@shared_task
def detect_duplicates():
    try:
        from .models import Contribution
        from math import radians, cos, sin, asin, sqrt

        recent = Contribution.objects.filter(
            status='submitted',
            created_at__gte=timezone.now() - timezone.timedelta(hours=24),
            location__isnull=False,
        )

        duplicates_found = 0

        for contribution in recent:
            if not contribution.location:
                continue

            nearby = Contribution.objects.filter(
                type=contribution.type,
                status='submitted',
                location__isnull=False,
                created_at__gte=timezone.now() - timezone.timedelta(hours=24),
            ).exclude(id=contribution.id)

            for other in nearby:
                if not other.location:
                    continue

                lat1, lon1 = radians(contribution.location.y), radians(contribution.location.x)
                lat2, lon2 = radians(other.location.y), radians(other.location.x)

                dlat = lat2 - lat1
                dlon = lon2 - lon1

                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * asin(sqrt(a))

                km = 6371 * c

                if km < 0.1:
                    other.status = 'duplicate'
                    other.save()
                    duplicates_found += 1
                    break

        return {
            'status': 'completed',
            'duplicates_found': duplicates_found,
        }
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
        }
