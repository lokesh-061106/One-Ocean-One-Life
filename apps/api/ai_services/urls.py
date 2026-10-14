from django.urls import path
from . import views

urlpatterns = [
    path('species/identify/', views.SpeciesIdentifyView.as_view(), name='species_identify'),
    path('species/history/', views.SpeciesIdentifyListView.as_view(), name='species_identify_list'),
    path('species/<uuid:pk>/verify/', views.SpeciesVerifyView.as_view(), name='species_verify'),
    path('voice/transcribe/', views.VoiceTranscribeView.as_view(), name='voice_transcribe'),
    path('voice/history/', views.VoiceObservationListView.as_view(), name='voice_observation_list'),
    path('translate/', views.TranslateView.as_view(), name='translate'),
    path('search/', views.SemanticSearchView.as_view(), name='semantic_search'),
    path('quality/check/', views.DataQualityCheckView.as_view(), name='quality_check'),
    path('quality/bulk/', views.DataQualityBulkView.as_view(), name='quality_bulk'),
]
