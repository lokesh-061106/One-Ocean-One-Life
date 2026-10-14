from django.urls import path
from . import views_research

urlpatterns = [
    path('observations/', views_research.ResearchObservationsView.as_view(), name='research_observations'),
    path('export/', views_research.ResearchExportView.as_view(), name='research_export'),
]
