from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.EmergencyProfileView.as_view(), name='emergency_profile'),
    path('offline-data/', views.EmergencyOfflineDataView.as_view(), name='emergency_offline_data'),
    path('nearest/', views.EmergencyNearestContactsView.as_view(), name='emergency_nearest'),
]
