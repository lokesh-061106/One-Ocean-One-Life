from django.urls import path
from . import views

urlpatterns = [
    path("header-menu/", views.HeaderMenuView.as_view(), name="header_menu"),
    path("menu-items/", views.MenuItemListCreateView.as_view(), name="menu_item_list"),
    path("menu-items/bulk/", views.MenuItemBulkUpdateView.as_view(), name="menu_item_bulk"),
    path("menu-items/<int:pk>/", views.MenuItemDetailView.as_view(), name="menu_item_detail"),
    path("", views.PageListView.as_view(), name="cms_page_list"),
    path("<slug:slug>/", views.PageDetailView.as_view(), name="cms_page_detail"),
]
