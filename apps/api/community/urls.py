from django.urls import path
from . import views

urlpatterns = [
    path('events/', views.EventListView.as_view(), name='event_list'),
    path('events/create/', views.EventCreateView.as_view(), name='event_create'),
    path('events/<str:pk>/', views.EventDetailView.as_view(), name='event_detail'),
    path('events/<str:pk>/update/', views.EventUpdateView.as_view(), name='event_update'),
    path('events/<str:pk>/delete/', views.EventDeleteView.as_view(), name='event_delete'),
    path('events/<str:pk>/join/', views.EventJoinView.as_view(), name='event_join'),
    path('events/<str:pk>/leave/', views.EventLeaveView.as_view(), name='event_leave'),
    path('posts/', views.CommunityPostListView.as_view(), name='community_post_list'),
    path('posts/create/', views.CommunityPostCreateView.as_view(), name='community_post_create'),
    path('posts/<uuid:pk>/update/', views.CommunityPostUpdateView.as_view(), name='community_post_update'),
    path('posts/<uuid:pk>/delete/', views.CommunityPostDeleteView.as_view(), name='community_post_delete'),
]
