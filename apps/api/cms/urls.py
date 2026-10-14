from django.urls import path
from . import views

urlpatterns = [
    path("header-menu/", views.HeaderMenuView.as_view(), name="header_menu"),
    path("", views.PageListView.as_view(), name="cms_page_list"),
    path("<slug:slug>/", views.PageDetailView.as_view(), name="cms_page_detail"),
]
