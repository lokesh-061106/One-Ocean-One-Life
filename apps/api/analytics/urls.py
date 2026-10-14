from django.urls import path
from . import views

urlpatterns = [
    path('annual-reports/', views.AnnualReportListView.as_view(), name='annual_report_list'),
    path('annual-reports/generate/', views.AnnualReportGenerateView.as_view(), name='annual_report_generate'),
    path('annual-reports/<uuid:pk>/', views.AnnualReportDetailView.as_view(), name='annual_report_detail'),
    path('monthly-trends/', views.MonthlyTrendListView.as_view(), name='monthly_trend_list'),
    path('year-comparison/', views.YearComparisonView.as_view(), name='year_comparison'),
    path('variance/', views.ContributionVarianceView.as_view(), name='contribution_variance'),
]
