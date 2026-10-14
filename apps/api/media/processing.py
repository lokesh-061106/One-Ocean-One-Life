import os
import subprocess
from PIL import Image
from django.conf import settings


THUMBNAIL_SIZES = {
    'small': (150, 150),
    'medium': (300, 300),
    'large': (600, 600),
}

AUDIO_FORMATS = ['mp3', 'ogg', 'wav']
AUDIO_BITRATE = '128k'
AUDIO_SAMPLE_RATE = 44100


def process_image(file_path):
    try:
        with Image.open(file_path) as img:
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            exif = img.info.get('exif')

            base_name = os.path.splitext(file_path)[0]
            ext = os.path.splitext(file_path)[1]

            processed_path = f"{base_name}_processed{ext}"
            img.save(processed_path, quality=85, optimize=True)

            thumbnails = {}
            for size_name, size in THUMBNAIL_SIZES.items():
                thumb_path = f"{base_name}_{size_name}{ext}"
                thumb = img.copy()
                thumb.thumbnail(size, Image.Resampling.LANCZOS)
                thumb.save(thumb_path, quality=80, optimize=True)
                thumbnails[size_name] = thumb_path

            return {
                'original': file_path,
                'processed': processed_path,
                'thumbnails': thumbnails,
                'width': img.width,
                'height': img.height,
            }
    except Exception as e:
        print(f"Image processing error: {e}")
        return None


def compress_audio(file_path, output_format='mp3'):
    try:
        base_name = os.path.splitext(file_path)[0]
        output_path = f"{base_name}.{output_format}"

        cmd = [
            'ffmpeg',
            '-i', file_path,
            '-acodec', 'libmp3lame' if output_format == 'mp3' else 'libvorbis',
            '-ab', AUDIO_BITRATE,
            '-ar', str(AUDIO_SAMPLE_RATE),
            '-ac', '1',
            '-y',
            output_path,
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr}")
            return None

        original_size = os.path.getsize(file_path)
        compressed_size = os.path.getsize(output_path)

        duration = get_audio_duration(output_path)

        return {
            'original': file_path,
            'compressed': output_path,
            'format': output_format,
            'original_size': original_size,
            'compressed_size': compressed_size,
            'compression_ratio': round(compressed_size / original_size, 2) if original_size > 0 else 0,
            'duration': duration,
        }
    except Exception as e:
        print(f"Audio compression error: {e}")
        return None


def get_audio_duration(file_path):
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file_path,
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            return float(result.stdout.strip())
    except Exception:
        pass

    return 0


def extract_video_thumbnail(file_path, time_offset=1):
    try:
        base_name = os.path.splitext(file_path)[0]
        thumbnail_path = f"{base_name}_thumb.jpg"

        cmd = [
            'ffmpeg',
            '-i', file_path,
            '-ss', str(time_offset),
            '-vframes', '1',
            '-vf', 'scale=640:-1',
            '-y',
            thumbnail_path,
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"FFmpeg thumbnail error: {result.stderr}")
            return None

        return thumbnail_path
    except Exception as e:
        print(f"Video thumbnail error: {e}")
        return None


def get_video_info(file_path):
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration,size:stream=width,height,codec_name',
            '-of', 'json',
            file_path,
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            import json
            info = json.loads(result.stdout)
            return {
                'duration': float(info.get('format', {}).get('duration', 0)),
                'size': int(info.get('format', {}).get('size', 0)),
                'width': info.get('streams', [{}])[0].get('width', 0),
                'height': info.get('streams', [{}])[0].get('height', 0),
                'codec': info.get('streams', [{}])[0].get('codec_name', ''),
            }
    except Exception as e:
        print(f"Video info error: {e}")

    return None


def process_media(file_path, media_type):
    if media_type == 'image':
        return process_image(file_path)
    elif media_type == 'audio':
        return compress_audio(file_path)
    elif media_type == 'video':
        thumbnail = extract_video_thumbnail(file_path)
        info = get_video_info(file_path)
        return {
            'thumbnail': thumbnail,
            'info': info,
        }
    return None


def delete_media_files(file_path):
    try:
        base_name = os.path.splitext(file_path)[0]
        ext = os.path.splitext(file_path)[1]

        files_to_delete = [file_path]

        for size_name in THUMBNAIL_SIZES.keys():
            thumb_path = f"{base_name}_{size_name}{ext}"
            if os.path.exists(thumb_path):
                files_to_delete.append(thumb_path)

        processed_path = f"{base_name}_processed{ext}"
        if os.path.exists(processed_path):
            files_to_delete.append(processed_path)

        thumb_path = f"{base_name}_thumb.jpg"
        if os.path.exists(thumb_path):
            files_to_delete.append(thumb_path)

        for f in files_to_delete:
            if os.path.exists(f):
                os.remove(f)

        return True
    except Exception as e:
        print(f"Media deletion error: {e}")
        return False
