from rest_framework import serializers
from .models import ProductCategory, Vendor, Product, Order, OrderItem, PaymentTransaction


class ProductCategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'product_count']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class VendorSerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)

    class Meta:
        model = Vendor
        fields = [
            'id', 'slug', 'shop_name', 'description', 'village', 'village_name',
            'phone', 'is_verified', 'rating', 'total_sales',
            'latitude', 'longitude', 'created_at',
        ]
        read_only_fields = ['id', 'is_verified', 'rating', 'total_sales', 'created_at']


class ProductListSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.shop_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'category_name', 'vendor', 'vendor_name',
            'price', 'discount_price', 'contribution_discount_percent',
            'image', 'stock', 'is_active', 'is_featured', 'units_sold', 'rating',
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    vendor = VendorSerializer(read_only=True)
    category = ProductCategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'vendor', 'category', 'name', 'description', 'price',
            'discount_price', 'contribution_discount_percent',
            'min_contribution_score', 'image', 'stock', 'is_active', 'is_featured',
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'discount_applied']


class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'payment_method',
            'subtotal', 'discount', 'total', 'items_count', 'created_at',
        ]

    def get_items_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='buyer.username', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer', 'buyer_name', 'status',
            'payment_method', 'payment_id', 'subtotal', 'discount', 'total',
            'shipping_address', 'shipping_phone', 'notes',
            'paid_at', 'shipped_at', 'delivered_at', 'items', 'created_at',
        ]


class OrderCreateSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES)
    shipping_address = serializers.CharField()
    shipping_phone = serializers.CharField(max_length=20)
    notes = serializers.CharField(required=False, default='')

    class OrderItemInputSerializer(serializers.Serializer):
        product = serializers.UUIDField()
        quantity = serializers.IntegerField(min_value=1)

    items = OrderItemInputSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'order', 'gateway', 'gateway_order_id', 'gateway_payment_id',
            'amount', 'currency', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class VendorCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ['shop_name', 'description', 'location', 'village', 'phone', 'latitude', 'longitude']
