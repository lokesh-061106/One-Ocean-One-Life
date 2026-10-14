from django.urls import path
from . import views

urlpatterns = [
    path('', views.ObservationListView.as_view(), name='observation_list'),
    path('<slug:pk>/', views.ObservationDetailView.as_view(), name='observation_detail'),
]
