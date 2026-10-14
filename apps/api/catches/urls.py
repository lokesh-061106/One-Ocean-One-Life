from django.urls import path
from . import views

urlpatterns = [
    path('', views.FishCatchListView.as_view(), name='fish_catch_list'),
    path('<slug:pk>/', views.FishCatchDetailView.as_view(), name='fish_catch_detail'),
]
