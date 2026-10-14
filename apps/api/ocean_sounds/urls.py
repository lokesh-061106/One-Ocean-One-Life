from django.urls import path
from . import views

urlpatterns = [
    path('', views.OceanSoundListView.as_view(), name='ocean_sound_list'),
    path('create/', views.OceanSoundCreateView.as_view(), name='ocean_sound_create'),
    path('library/categories/', views.SoundLibraryCategoryListView.as_view(), name='sound_library_categories'),
    path('library/items/', views.SoundLibraryItemListView.as_view(), name='sound_library_items'),
    path('library/items/<slug:slug>/', views.SoundLibraryItemDetailView.as_view(), name='sound_library_item_detail'),
    path('<uuid:pk>/', views.OceanSoundDetailView.as_view(), name='ocean_sound_detail'),
]
