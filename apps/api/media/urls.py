from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.MediaUploadView.as_view(), name='media_upload'),
    path('upload/multi/', views.MediaMultiUploadView.as_view(), name='media_multi_upload'),
]
