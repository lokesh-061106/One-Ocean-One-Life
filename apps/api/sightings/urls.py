from django.urls import path
from . import views

urlpatterns = [
    path('', views.MarineSightingListView.as_view(), name='marine_sighting_list'),
    path('categories/', views.SightingCategoryListView.as_view(), name='sighting_category_list'),
    path('create/', views.MarineSightingCreateView.as_view(), name='marine_sighting_create'),
    path('<slug:pk>/', views.MarineSightingDetailView.as_view(), name='marine_sighting_detail'),
]
