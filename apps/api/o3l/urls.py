from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from core.views_security import AccountDeleteView, DataExportView, ConsentView, AuditLogListView

admin.site.site_header = "One Ocean One Life - Admin"
admin.site.site_title = "O3L Admin"
admin.site.index_title = "Dashboard"
admin.site.login_template = "admin/login.html"
admin.site.logout_template = "admin/logged_out.html"

def api_root(request):
    return JsonResponse({
        'name': 'O3L API',
        'version': 'v1',
        'endpoints': {
            'auth': '/api/v1/auth/',
            'zones': '/api/v1/zones/',
            'districts': '/api/v1/districts/',
            'villages': '/api/v1/villages/',
            'guides': '/api/v1/guides/',
            'education': '/api/v1/education/',
            'contributions': '/api/v1/contributions/',
            'sounds': '/api/v1/sounds/',
            'sightings': '/api/v1/sightings/',
            'catches': '/api/v1/catches/',
            'observations': '/api/v1/observations/',
            'community': '/api/v1/community/',
            'maps': '/api/v1/maps/',
            'recognition': '/api/v1/recognition/',
            'emergency': '/api/v1/emergency/',
            'search': '/api/v1/search/',
            'notifications': '/api/v1/notifications/',
            'media': '/api/v1/media/',
            'marketplace': '/api/v1/marketplace/',
            'ecotourism': '/api/v1/ecotourism/',
            'livelihood': '/api/v1/livelihood/',
            'analytics': '/api/v1/analytics/',
            'research': '/api/v1/research/',
            'ai': '/api/v1/ai/',
            'security': '/api/v1/security/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/', include('locations.urls')),
    path('api/v1/guides/', include('guides.urls')),
    path('api/v1/education/', include('education.urls')),
    path('api/v1/contributions/', include('contributions.urls')),
    path('api/v1/sounds/', include('ocean_sounds.urls')),
    path('api/v1/sightings/', include('sightings.urls')),
    path('api/v1/catches/', include('catches.urls')),
    path('api/v1/observations/', include('observations.urls')),
    path('api/v1/community/', include('community.urls')),
    path('api/v1/maps/', include('maps.urls')),
    path('api/v1/recognition/', include('recognition.urls')),
    path('api/v1/emergency/', include('emergency.urls')),
    path('api/v1/search/', include('search.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/media/', include('media.urls')),
    path('api/v1/cms/', include('cms.urls')),
    path('api/v1/marketplace/', include('marketplace.urls')),
    path('api/v1/ecotourism/', include('ecotourism.urls')),
    path('api/v1/livelihood/', include('livelihood.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/research/', include('analytics.urls_research')),
    path('api/v1/ai/', include('ai_services.urls')),
    path('api/v1/security/delete-account/', AccountDeleteView.as_view(), name='account_delete'),
    path('api/v1/security/export-data/', DataExportView.as_view(), name='data_export'),
    path('api/v1/security/consent/', ConsentView.as_view(), name='consent'),
    path('api/v1/security/audit-logs/', AuditLogListView.as_view(), name='audit_logs'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
