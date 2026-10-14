from celery import shared_task
from django.utils import timezone


@shared_task(bind=True, max_retries=3)
def process_media_task(self, file_path, media_type):
    try:
        from .processing import process_media

        result = process_media(file_path, media_type)

        if result is None:
            raise Exception("Media processing failed")

        return {
            'status': 'completed',
            'file_path': file_path,
            'media_type': media_type,
            'result': result,
        }
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def process_image_task(self, file_path):
    return process_media_task(self, file_path, 'image')


@shared_task(bind=True, max_retries=3)
def compress_audio_task(self, file_path):
    return process_media_task(self, file_path, 'audio')


@shared_task(bind=True, max_retries=3)
def extract_video_thumbnail_task(self, file_path):
    return process_media_task(self, file_path, 'video')


@shared_task
def cleanup_old_media():
    from django.conf import settings
    import os
    from datetime import timedelta

    media_root = settings.MEDIA_ROOT
    cutoff = timezone.now() - timedelta(days=30)

    for root, dirs, files in os.walk(media_root):
        for file in files:
            filepath = os.path.join(root, file)
            if os.path.getmtime(filepath) < cutoff.timestamp():
                if file.endswith(('_temp', '_processing')):
                    try:
                        os.remove(filepath)
                    except Exception:
                        pass


@shared_task
def generate_thumbnails_batch(file_paths):
    from .processing import process_image

    results = []
    for file_path in file_paths:
        result = process_image(file_path)
        if result:
            results.append(result)

    return {
        'status': 'completed',
        'processed': len(results),
        'results': results,
    }
