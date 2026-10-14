import os
import uuid
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.authentication import JWTAuthentication


ALLOWED_TYPES = {
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg',
    'video/mp4', 'video/quicktime',
    'application/pdf',
}

MAX_FILE_SIZE = {
    'image': 10 * 1024 * 1024,
    'audio': 50 * 1024 * 1024,
    'video': 100 * 1024 * 1024,
    'application': 10 * 1024 * 1024,
}


def get_upload_path(content_type):
    if content_type.startswith('image/'):
        return 'uploads/images'
    elif content_type.startswith('audio/'):
        return 'uploads/audio'
    elif content_type.startswith('video/'):
        return 'uploads/video'
    return 'uploads/documents'


def generate_filename(original_name):
    ext = os.path.splitext(original_name)[1].lower()
    return f"{uuid.uuid4().hex}{ext}"


def trigger_processing(filepath, content_type):
    try:
        if content_type.startswith('image/'):
            from .tasks import process_image_task
            process_image_task.delay(filepath)
        elif content_type.startswith('audio/'):
            from .tasks import compress_audio_task
            compress_audio_task.delay(filepath)
        elif content_type.startswith('video/'):
            from .tasks import extract_video_thumbnail_task
            extract_video_thumbnail_task.delay(filepath)
    except Exception:
        pass


class MediaUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'No file provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.content_type not in ALLOWED_TYPES:
            return Response(
                {'error': f'File type {file.content_type} not allowed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        category = file.content_type.split('/')[0]
        max_size = MAX_FILE_SIZE.get(category, 10 * 1024 * 1024)
        if file.size > max_size:
            max_mb = max_size // (1024 * 1024)
            return Response(
                {'error': f'File too large. Maximum size is {max_mb}MB.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        upload_dir = get_upload_path(file.content_type)
        full_dir = os.path.join(settings.MEDIA_ROOT, upload_dir)
        os.makedirs(full_dir, exist_ok=True)

        filename = generate_filename(file.name)
        filepath = os.path.join(full_dir, filename)

        with open(filepath, 'wb+') as dest:
            for chunk in file.chunks():
                dest.write(chunk)

        relative_url = f"{upload_dir}/{filename}"
        full_filepath = os.path.join(settings.MEDIA_ROOT, relative_url)

        trigger_processing(full_filepath, file.content_type)

        return Response({
            'url': f"{settings.MEDIA_URL}{relative_url}",
            'name': file.name,
            'size': file.size,
            'type': file.content_type,
            'path': relative_url,
        }, status=status.HTTP_201_CREATED)


class MediaMultiUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        files = request.FILES.getlist('files')
        if not files:
            return Response(
                {'error': 'No files provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(files) > 10:
            return Response(
                {'error': 'Maximum 10 files per request.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = []
        errors = []

        for file in files:
            if file.content_type not in ALLOWED_TYPES:
                errors.append({'name': file.name, 'error': f'Type {file.content_type} not allowed'})
                continue

            category = file.content_type.split('/')[0]
            max_size = MAX_FILE_SIZE.get(category, 10 * 1024 * 1024)
            if file.size > max_size:
                max_mb = max_size // (1024 * 1024)
                errors.append({'name': file.name, 'error': f'Too large. Max {max_mb}MB'})
                continue

            upload_dir = get_upload_path(file.content_type)
            full_dir = os.path.join(settings.MEDIA_ROOT, upload_dir)
            os.makedirs(full_dir, exist_ok=True)

            filename = generate_filename(file.name)
            filepath = os.path.join(full_dir, filename)

            with open(filepath, 'wb+') as dest:
                for chunk in file.chunks():
                    dest.write(chunk)

            relative_url = f"{upload_dir}/{filename}"
            full_filepath = os.path.join(settings.MEDIA_ROOT, relative_url)

            trigger_processing(full_filepath, file.content_type)

            results.append({
                'url': f"{settings.MEDIA_URL}{relative_url}",
                'name': file.name,
                'size': file.size,
                'type': file.content_type,
                'path': relative_url,
            })

        return Response({
            'uploaded': results,
            'errors': errors,
            'total': len(results),
        }, status=status.HTTP_201_CREATED)
