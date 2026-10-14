import os
import json
import requests
from django.conf import settings
from firebase_admin import credentials, messaging
import firebase_admin


FCM_SERVER_KEY = os.environ.get('FCM_SERVER_KEY', '')
FIREBASE_CREDENTIALS_PATH = os.environ.get('FIREBASE_CREDENTIALS_PATH', '')

_app_initialized = False


def initialize_firebase():
    global _app_initialized
    if _app_initialized:
        return

    if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        _app_initialized = True
    elif FCM_SERVER_KEY:
        _app_initialized = True


def send_push_notification(token, title, body, data=None, image=None):
    initialize_firebase()

    if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
        return send_via_firebase_admin(token, title, body, data, image)
    elif FCM_SERVER_KEY:
        return send_via_fcm_legacy(token, title, body, data, image)

    return False


def send_via_firebase_admin(token, title, body, data=None, image=None):
    try:
        notification = messaging.Notification(
            title=title,
            body=body,
            image=image,
        )

        android_config = messaging.AndroidConfig(
            priority='high',
            notification=messaging.AndroidNotification(
                title=title,
                body=body,
                image=image,
            ),
        )

        apns_config = messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    alert=messaging.ApsAlert(
                        title=title,
                        body=body,
                    ),
                    badge=1,
                ),
            ),
        )

        message = messaging.Message(
            notification=notification,
            android=android_config,
            apns=apns_config,
            data=data or {},
            token=token,
        )

        response = messaging.send(message)
        return True
    except Exception as e:
        print(f"Firebase send error: {e}")
        return False


def send_via_fcm_legacy(token, title, body, data=None, image=None):
    try:
        headers = {
            'Authorization': f'key={FCM_SERVER_KEY}',
            'Content-Type': 'application/json',
        }

        payload = {
            'to': token,
            'notification': {
                'title': title,
                'body': body,
            },
            'data': data or {},
        }

        if image:
            payload['notification']['image'] = image

        response = requests.post(
            'https://fcm.googleapis.com/fcm/send',
            headers=headers,
            json=payload,
        )

        return response.status_code == 200
    except Exception as e:
        print(f"FCM send error: {e}")
        return False


def send_bulk_push(tokens, title, body, data=None, image=None):
    initialize_firebase()

    if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
        return send_bulk_via_firebase_admin(tokens, title, body, data, image)
    elif FCM_SERVER_KEY:
        return send_bulk_via_fcm_legacy(tokens, title, body, data, image)

    return 0


def send_bulk_via_firebase_admin(tokens, title, body, data=None, image=None):
    try:
        notification = messaging.Notification(
            title=title,
            body=body,
            image=image,
        )

        message = messaging.MulticastMessage(
            notification=notification,
            data=data or {},
            tokens=tokens,
        )

        response = messaging.send_each_for_multicast(message)
        return response.success_count
    except Exception as e:
        print(f"Firebase bulk send error: {e}")
        return 0


def send_bulk_via_fcm_legacy(tokens, title, body, data=None, image=None):
    try:
        headers = {
            'Authorization': f'key={FCM_SERVER_KEY}',
            'Content-Type': 'application/json',
        }

        payload = {
            'registration_ids': tokens,
            'notification': {
                'title': title,
                'body': body,
            },
            'data': data or {},
        }

        if image:
            payload['notification']['image'] = image

        response = requests.post(
            'https://fcm.googleapis.com/fcm/send',
            headers=headers,
            json=payload,
        )

        if response.status_code == 200:
            result = response.json()
            return result.get('success', 0)
        return 0
    except Exception as e:
        print(f"FCM bulk send error: {e}")
        return 0


def send_notification_to_user(user, title, body, notification_type='system', data=None):
    from accounts.models import DeviceToken

    devices = DeviceToken.objects.filter(
        user=user,
        is_active=True,
    )

    tokens = list(devices.values_list('device_token', flat=True))

    if not tokens:
        return 0

    push_data = {
        'type': notification_type,
        **(data or {}),
    }

    return send_bulk_push(tokens, title, body, data=push_data)


NOTIFICATION_TEMPLATES = {
    'verification_approved': {
        'title': 'Contribution Verified!',
        'body': 'Your contribution has been verified. Keep up the great work!',
    },
    'verification_rejected': {
        'title': 'Contribution Needs Attention',
        'body': 'Your contribution was not verified. Please review the feedback.',
    },
    'emergency_alert': {
        'title': 'Emergency Alert',
        'body': 'An emergency has been reported in your area.',
    },
    'event_reminder': {
        'title': 'Event Reminder',
        'body': 'You have an upcoming event.',
    },
    'recognition_award': {
        'title': 'New Award!',
        'body': 'You have received a new recognition award!',
    },
    'milestone_reached': {
        'title': 'Milestone Reached!',
        'body': 'Congratulations! You have reached a new milestone.',
    },
    'marketplace_order': {
        'title': 'New Order',
        'body': 'You have received a new order.',
    },
    'comment_received': {
        'title': 'New Comment',
        'body': 'Someone commented on your post.',
    },
}


def send_notification_by_type(user, notification_type, extra_data=None):
    template = NOTIFICATION_TEMPLATES.get(notification_type)
    if not template:
        return 0

    title = template['title']
    body = template['body']

    if extra_data:
        if 'title' in extra_data:
            title = extra_data['title']
        if 'body' in extra_data:
            body = extra_data['body']

    return send_notification_to_user(
        user,
        title,
        body,
        notification_type=notification_type,
        data=extra_data,
    )
