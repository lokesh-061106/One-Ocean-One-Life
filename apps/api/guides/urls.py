from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.GuideCategoryListView.as_view(), name='guide_category_list'),
    path('species/', views.GuideSpeciesListView.as_view(), name='guide_species_list'),
    path('species/create/', views.GuideSpeciesCreateView.as_view(), name='guide_species_create'),
    path('species/<slug:pk>/', views.GuideSpeciesDetailView.as_view(), name='guide_species_detail'),
    path('species/<uuid:pk>/update/', views.GuideSpeciesUpdateView.as_view(), name='guide_species_update'),
    path('species/<uuid:pk>/delete/', views.GuideSpeciesDeleteView.as_view(), name='guide_species_delete'),
]
