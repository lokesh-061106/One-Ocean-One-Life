from django.urls import path
from . import views
from . import webhooks

urlpatterns = [
    path('categories/', views.ProductCategoryListView.as_view(), name='product_category_list'),
    path('vendors/', views.VendorListView.as_view(), name='vendor_list'),
    path('vendors/create/', views.VendorCreateView.as_view(), name='vendor_create'),
    path('vendors/<slug:pk>/', views.VendorDetailView.as_view(), name='vendor_detail'),
    path('vendors/me/update/', views.VendorUpdateView.as_view(), name='vendor_update'),
    path('products/', views.ProductListView.as_view(), name='product_list'),
    path('products/create/', views.ProductCreateView.as_view(), name='product_create'),
    path('products/<slug:slug>/', views.ProductDetailView.as_view(), name='product_detail'),
    path('products/<uuid:pk>/update/', views.ProductUpdateView.as_view(), name='product_update'),
    path('products/<uuid:pk>/delete/', views.ProductDeleteView.as_view(), name='product_delete'),
    path('orders/', views.OrderListView.as_view(), name='order_list'),
    path('orders/create/', views.OrderCreateView.as_view(), name='order_create'),
    path('orders/<uuid:pk>/', views.OrderDetailView.as_view(), name='order_detail'),
    path('payments/verify/', views.PaymentVerifyView.as_view(), name='payment_verify'),
    path('webhooks/razorpay/', webhooks.razorpay_webhook, name='razorpay_webhook'),
    path('webhooks/stripe/', webhooks.stripe_webhook, name='stripe_webhook'),
]
