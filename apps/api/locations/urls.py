from django.urls import path
from . import views

urlpatterns = [
    path('zones/', views.ZoneListView.as_view(), name='zone_list'),
    path('zones/<slug:slug>/', views.ZoneDetailView.as_view(), name='zone_detail'),
    path('states/', views.StateListView.as_view(), name='state_list'),
    path('districts/', views.DistrictListView.as_view(), name='district_list'),
    path('villages/', views.VillageListView.as_view(), name='village_list'),
    path('villages/<uuid:pk>/', views.VillageDetailView.as_view(), name='village_detail'),
    path('state-profiles/', views.StateProfileListView.as_view(), name='state_profile_list'),
    path('state-profiles/<slug:slug>/', views.StateProfileDetailView.as_view(), name='state_profile_detail'),
]
