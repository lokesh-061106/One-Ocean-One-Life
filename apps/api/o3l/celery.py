import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'o3l.settings.development')

app = Celery('o3l')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'generate-hotspots-daily': {
        'task': 'maps.tasks.generate_hotspots',
        'schedule': crontab(hour=2, minute=0),
    },
    'generate-monthly-trends-monthly': {
        'task': 'analytics.tasks.generate_monthly_trends',
        'schedule': crontab(day_of_month=1, hour=3, minute=0),
    },
    'bulk-update-scores-daily': {
        'task': 'contributions.tasks.bulk_update_scores_task',
        'schedule': crontab(hour=4, minute=0),
    },
    'refresh-recognition-scores-daily': {
        'task': 'recognition.tasks.refresh_recognition_scores_task',
        'schedule': crontab(hour=4, minute=30),
    },
    'auto-validate-contributions-hourly': {
        'task': 'contributions.tasks.auto_validate_contributions',
        'schedule': crontab(minute=0),  # Every hour
    },
    'send-verification-reminders-daily': {
        'task': 'contributions.tasks.send_verification_reminders',
        'schedule': crontab(hour=9, minute=0),
    },
    'detect-duplicates-hourly': {
        'task': 'contributions.tasks.detect_duplicates',
        'schedule': crontab(minute=30),  # Every hour at :30
    },
    'cleanup-old-notifications-weekly': {
        'task': 'notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(day_of_week=0, hour=2, minute=0),  # Sunday 2 AM
    },
    'cleanup-old-media-monthly': {
        'task': 'media.tasks.cleanup_old_media',
        'schedule': crontab(day_of_month=1, hour=1, minute=0),  # 1st of month 1 AM
    },
}
