from django.contrib import admin
from core.models_security import AuditLog, UserConsent, DataExportRequest


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'resource_type', 'resource_id', 'ip_address', 'created_at']
    list_filter = ['action', 'resource_type']
    search_fields = ['user__username', 'resource_type', 'ip_address']
    readonly_fields = ['user', 'action', 'resource_type', 'resource_id', 'ip_address', 'user_agent', 'details', 'changes', 'created_at']


@admin.register(UserConsent)
class UserConsentAdmin(admin.ModelAdmin):
    list_display = ['user', 'consent_type', 'granted', 'created_at']
    list_filter = ['consent_type', 'granted']


@admin.register(DataExportRequest)
class DataExportRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'created_at']
    list_filter = ['status']
