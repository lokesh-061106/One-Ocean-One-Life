from django.contrib import admin
from .models import ProductCategory, Vendor, Product, Order, OrderItem, PaymentTransaction


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['shop_name', 'user', 'village', 'is_verified', 'rating', 'total_sales']
    list_filter = ['is_verified']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'vendor', 'category', 'price', 'stock', 'is_active', 'is_featured']
    list_filter = ['category', 'is_active', 'is_featured']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'quantity', 'unit_price', 'discount_applied']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'buyer', 'status', 'payment_method', 'total', 'created_at']
    list_filter = ['status', 'payment_method']
    inlines = [OrderItemInline]


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['order', 'gateway', 'amount', 'status', 'created_at']
    list_filter = ['gateway', 'status']
