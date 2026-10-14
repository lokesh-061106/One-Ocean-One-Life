from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.EducationCategoryListView.as_view(), name='education_category_list'),
    path('posts/', views.EducationPostListView.as_view(), name='education_post_list'),
    path('posts/create/', views.EducationPostCreateView.as_view(), name='education_post_create'),
    path('posts/<str:identifier>/', views.EducationPostDetailView.as_view(), name='education_post_detail'),
]
