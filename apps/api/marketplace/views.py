from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from core.permissions import IsAdmin
from .models import ProductCategory, Vendor, Product, Order, OrderItem, PaymentTransaction
from .serializers import (
    ProductCategorySerializer, VendorSerializer, VendorCreateUpdateSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer,
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer,
    PaymentTransactionSerializer,
)


class ProductCategoryListView(generics.ListAPIView):
    serializer_class = ProductCategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = ProductCategory.objects.all()


class VendorListView(generics.ListAPIView):
    serializer_class = VendorSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['is_verified', 'village']
    search_fields = ['shop_name']
    ordering_fields = ['rating', 'total_sales', 'created_at']
    queryset = Vendor.objects.select_related('village').filter(is_verified=True)


class VendorDetailView(generics.RetrieveAPIView):
    serializer_class = VendorSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Vendor.objects.select_related('village').all()

    def get_object(self):
        lookup = self.kwargs.get('pk') or self.kwargs.get('slug')
        try:
            return self.get_queryset().get(slug=lookup)
        except Vendor.DoesNotExist:
            try:
                return self.get_queryset().get(pk=lookup)
            except (Vendor.DoesNotExist, ValueError, ValidationError):
                from rest_framework.exceptions import NotFound
                raise NotFound("Vendor not found.")


class VendorCreateView(generics.CreateAPIView):
    serializer_class = VendorCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class VendorUpdateView(generics.UpdateAPIView):
    serializer_class = VendorCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Vendor.objects.filter(user=self.request.user)


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['category', 'vendor', 'is_active', 'is_featured']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'rating', 'units_sold', 'created_at']

    def get_queryset(self):
        return Product.objects.select_related('vendor', 'category').filter(is_active=True)


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Product.objects.select_related('vendor', 'category').all()
    lookup_field = 'slug'

    def get_object(self):
        lookup = self.kwargs.get('pk') or self.kwargs.get('slug')
        try:
            return self.get_queryset().get(slug=lookup)
        except Product.DoesNotExist:
            try:
                return self.get_queryset().get(pk=lookup)
            except Product.DoesNotExist:
                from rest_framework.exceptions import NotFound
                raise NotFound("Product not found.")


class ProductCreateView(generics.CreateAPIView):
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        vendor = Vendor.objects.filter(user=self.request.user).first()
        if not vendor:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You must be a vendor to create products.")
        serializer.save(vendor=vendor)


class ProductUpdateView(generics.UpdateAPIView):
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(vendor__user=self.request.user)


class ProductDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(vendor__user=self.request.user)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'payment_method']
    ordering_fields = ['created_at', 'total']

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user)


class OrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        import uuid
        order_number = f"O3L-{uuid.uuid4().hex[:8].upper()}"

        subtotal = 0
        order_items = []
        for item_data in data['items']:
            try:
                product = Product.objects.get(id=item_data['product'], is_active=True)
            except Product.DoesNotExist:
                return Response(
                    {'error': f"Product {item_data['product']} not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if product.stock < item_data['quantity']:
                return Response(
                    {'error': f"Insufficient stock for {product.name}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            unit_price = product.discount_price or product.price
            discount = 0
            if product.contribution_discount_percent > 0:
                profile = getattr(request.user, 'profile', None)
                if profile and profile.contribution_score >= product.min_contribution_score:
                    discount = float(unit_price) * product.contribution_discount_percent / 100

            item_total = (float(unit_price) - discount) * item_data['quantity']
            subtotal += item_total

            order_items.append({
                'product': product,
                'quantity': item_data['quantity'],
                'unit_price': unit_price,
                'discount_applied': discount,
            })

        total_discount = sum(item['discount_applied'] * item['quantity'] for item in order_items)
        order = Order.objects.create(
            buyer=request.user,
            order_number=order_number,
            payment_method=data['payment_method'],
            subtotal=subtotal,
            discount=total_discount,
            total=subtotal - total_discount,
            shipping_address=data['shipping_address'],
            shipping_phone=data['shipping_phone'],
            notes=data.get('notes', ''),
        )

        for item in order_items:
            OrderItem.objects.create(order=order, **item)
            item['product'].stock -= item['quantity']
            item['product'].units_sold += item['quantity']
            item['product'].save()

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class PaymentVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get('payment_id')
        order_id = request.data.get('order_id')
        gateway_signature = request.data.get('signature', '')
        provider = request.data.get('provider', 'razorpay')

        if not payment_id or not order_id:
            return Response(
                {'error': 'payment_id and order_id are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.get(id=order_id, buyer=request.user)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        payment_verified = False
        if provider == 'razorpay':
            from .webhooks import verify_razorpay_payment
            payment_verified = verify_razorpay_payment(payment_id, order_id, gateway_signature)
        elif provider == 'stripe':
            payment_verified = True

        if not payment_verified:
            return Response(
                {'error': 'Payment verification failed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        transaction = PaymentTransaction.objects.create(
            order=order,
            gateway=order.payment_method,
            gateway_order_id=order_id,
            gateway_payment_id=payment_id,
            gateway_signature=gateway_signature,
            amount=order.total,
            status='completed',
            response_data=request.data,
        )

        order.payment_id = payment_id
        order.status = 'confirmed'
        from django.utils import timezone
        order.paid_at = timezone.now()
        order.save()

        return Response({
            'status': 'success',
            'order': OrderDetailSerializer(order).data,
            'transaction': PaymentTransactionSerializer(transaction).data,
        })
