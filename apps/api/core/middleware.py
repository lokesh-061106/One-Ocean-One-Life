import json
import os
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone


class RequestTraceMiddleware(MiddlewareMixin):
    """Log EVERY request reaching Django (including 401/403) to logs/requests.log.

    Debug aid for 'browser says success but nothing saved' issues — shows
    whether the request arrived, from which IP, with what auth header, and
    what status Django returned.
    """

    def process_request(self, request):
        self._trace(request, None)

    def process_response(self, request, response):
        self._trace(request, response)
        return response

    def _trace(self, request, response):
        try:
            if not request.path.startswith('/api/'):
                return
            from django.conf import settings
            log_dir = os.path.join(settings.BASE_DIR, 'logs')
            os.makedirs(log_dir, exist_ok=True)
            import datetime
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            status = response.status_code if response is not None else 'REQ'
            with open(os.path.join(log_dir, 'requests.log'), 'a', encoding='utf-8') as f:
                f.write(
                    f'{datetime.datetime.now().isoformat()} {status} {request.method} {request.path} '
                    f'from={request.META.get("REMOTE_ADDR", "?")} '
                    f'auth={"Bearer" if auth_header.startswith("Bearer") else auth_header or "none"} '
                    f'ua={(request.META.get("HTTP_USER_AGENT") or "")[:60]}\n'
                )
        except Exception:
            pass


class MediaFrameOptionsMiddleware(MiddlewareMixin):
    """Allow media files to be embedded in the website's document viewer.

    Django's XFrameOptionsMiddleware sets ``X-Frame-Options: DENY`` on every
    response, which makes browsers refuse to display PDFs inside an iframe on
    another origin (e.g. the Next.js storefront popup). Media files are static
    user uploads, so the clickjacking header is removed for them only.
    """

    def process_response(self, request, response):
        from django.conf import settings

        media_url = getattr(settings, 'MEDIA_URL', '') or '/media/'
        if request.path.startswith(media_url):
            try:
                del response['X-Frame-Options']
            except KeyError:
                pass
        return response


class AuditLogMiddleware(MiddlewareMixin):
    AUDIT_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}

    def process_response(self, request, response):
        if request.method not in self.AUDIT_METHODS:
            return response

        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response

        path = request.path
        if path.startswith('/admin/') or path.startswith('/api/v1/auth/login'):
            return response

        try:
            from core.models_security import AuditLog
            action_map = {
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'update',
                'DELETE': 'delete',
            }

            resource_type = 'unknown'
            parts = path.strip('/').split('/')
            if len(parts) >= 3:
                resource_type = parts[2] if parts[0] == 'api' else parts[1]

            changes = {}
            if request.method in ('PUT', 'PATCH') and hasattr(request, '_body'):
                try:
                    changes = json.loads(request._body)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    pass

            AuditLog.objects.create(
                user=request.user,
                action=action_map.get(request.method, 'read'),
                resource_type=resource_type,
                resource_id=request.resolver_match.kwargs.get('pk', ''),
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={'status_code': response.status_code, 'path': path},
                changes=changes,
            )
        except Exception:
            pass

        return response

    def process_request(self, request):
        if request.method not in self.AUDIT_METHODS:
            return None
        path = request.path
        if path.startswith('/admin/') or path.startswith('/api/v1/auth/login'):
            return None
        if request.method not in ('PUT', 'PATCH'):
            return None
        content_type = request.META.get('CONTENT_TYPE', '')
        if not content_type.startswith('application/json'):
            return None
        try:
            length = int(request.META.get('CONTENT_LENGTH') or 0)
        except (TypeError, ValueError):
            length = 0
        if length > 1024 * 1024:
            return None
        try:
            request._body = request.body
        except Exception:
            pass
        return None

    def _get_client_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
