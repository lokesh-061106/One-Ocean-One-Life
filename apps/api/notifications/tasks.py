from celery import shared_task
from django.utils import timezone


@shared_task(bind=True, max_retries=3)
def send_push_notification_task(self, user_id, title, body, notification_type='system', data=None):
    try:
        from accounts.models import User
        from .push import send_notification_to_user

        user = User.objects.get(id=user_id)
        result = send_notification_to_user(user, title, body, notification_type, data)

        return {
            'status': 'completed',
            'user_id': str(user_id),
            'devices_notified': result,
        }
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_bulk_notification_task(self, user_ids, title, body, notification_type='system', data=None):
    try:
        from accounts.models import User, DeviceToken
        from .push import send_bulk_push

        devices = DeviceToken.objects.filter(
            user_id__in=user_ids,
            is_active=True,
        ).values_list('device_token', flat=True)

        tokens = list(devices)

        if not tokens:
            return {
                'status': 'completed',
                'devices_notified': 0,
            }

        result = send_bulk_push(tokens, title, body, data)

        return {
            'status': 'completed',
            'devices_notified': result,
        }
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@shared_task
def send_notification_by_type_task(user_id, notification_type, extra_data=None):
    try:
        from accounts.models import User
        from .push import send_notification_by_type

        user = User.objects.get(id=user_id)
        result = send_notification_by_type(user, notification_type, extra_data)

        return {
            'status': 'completed',
            'user_id': str(user_id),
            'devices_notified': result,
        }
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
        }


@shared_task
def cleanup_old_notifications():
    from django.utils import timezone
    from datetime import timedelta
    from .models import Notification

    cutoff = timezone.now() - timedelta(days=90)
    deleted, _ = Notification.objects.filter(
        created_at__lt=cutoff,
        is_read=True,
    ).delete()

    return {
        'status': 'completed',
        'deleted': deleted,
    }
