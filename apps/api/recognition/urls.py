from django.urls import path
from . import views

urlpatterns = [
    path('awards/', views.RecognitionAwardListView.as_view(), name='recognition_award_list'),
    path('awards/me/', views.MyAwardsView.as_view(), name='recognition_award_me'),
    path('scores/', views.ContributionScoreListView.as_view(), name='contribution_score_list'),
    path('scores/me/', views.MyScoreView.as_view(), name='contribution_score_me'),
    path('scores/me/rank/', views.MyRankView.as_view(), name='contribution_score_me_rank'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
    path(
        'contributors/<str:contributor>/',
        views.ContributorRecognitionView.as_view(),
        name='contributor_recognition',
    ),
    path('summary/', views.ScoreboardSummaryView.as_view(), name='scoreboard_summary'),
    path('regions/', views.RegionSummaryView.as_view(), name='region_summary'),
    path('awareness-zones/', views.AwarenessZonesView.as_view(), name='awareness_zones'),
    path('tiers/', views.TierListView.as_view(), name='tier_list'),
    path('badges/', views.BadgeListView.as_view(), name='badge_list'),
    path('catalogue/', views.CatalogueView.as_view(), name='contribution_catalogue'),
    path('nearby/', views.NearbyContributorsView.as_view(), name='nearby_contributors'),
]
