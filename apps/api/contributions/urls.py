from django.urls import path
from . import views

urlpatterns = [
    path('types/', views.ContributionTypeListView.as_view(), name='contribution_type_list'),
    path('wizard-config/', views.ContributionWizardConfigView.as_view(), name='contribution_wizard_config'),
    path('', views.ContributionCreateView.as_view(), name='contribution_create'),
    path('my/', views.ContributionListView.as_view(), name='contribution_my_list'),
    path('my/stats/', views.ContributionMyStatsView.as_view(), name='contribution_my_stats'),
    path('public/', views.ContributionPublicListView.as_view(), name='contribution_public_list'),
    path('public/<str:lookup>/', views.ContributionPublicDetailView.as_view(), name='contribution_public_detail'),
    path('admin/all/', views.ContributionAdminListView.as_view(), name='contribution_admin_list'),
    path('<uuid:pk>/', views.ContributionDetailView.as_view(), name='contribution_detail'),
    path('<uuid:pk>/update/', views.ContributionUpdateView.as_view(), name='contribution_update'),
    path('<uuid:pk>/delete/', views.ContributionDeleteView.as_view(), name='contribution_delete'),
    path('<uuid:pk>/review/', views.ContributionReviewView.as_view(), name='contribution_review'),
]
