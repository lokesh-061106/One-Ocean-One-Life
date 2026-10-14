from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification_list'),
    path('read/', views.NotificationMarkReadView.as_view(), name='notification_mark_all_read'),
    path('<uuid:pk>/read/', views.NotificationMarkReadView.as_view(), name='notification_mark_read'),
]
