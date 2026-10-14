from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.text import slugify
from core.models import BaseModel


class ProductCategory(BaseModel):
    CATEGORY_CHOICES = [
        ('fishing_equipment', 'Fishing Equipment'),
        ('research_instruments', 'Research Instruments'),
        ('safety_products', 'Safety Products'),
        ('tourism_furniture', 'Tourism Furniture'),
        ('recycled_products', 'Recycled Products'),
        ('marine_equipment', 'Marine Equipment'),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'product_categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Vendor(BaseModel):
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='vendor_profile')
    shop_name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    location = gis_models.PointField(srid=4326, null=True, blank=True)
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    rating = models.FloatField(default=0)
    total_sales = models.IntegerField(default=0)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)

    def _generate_slug(self):
        base = slugify(self.shop_name)[:180] or 'vendor'
        slug = base
        counter = 2
        while Vendor.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{counter}"
            counter += 1
        return slug

    class Meta:
        db_table = 'vendors'
        ordering = ['-created_at']

    def __str__(self):
        return self.shop_name


class Product(BaseModel):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True, related_name='products')
    name = models.CharField(max_length=300)
    slug = models.SlugField(max_length=350, unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    contribution_discount_percent = models.IntegerField(default=0, help_text="Discount for verified contributors")
    min_contribution_score = models.IntegerField(default=0, help_text="Minimum score required for discount")
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    units_sold = models.IntegerField(default=0)
    rating = models.FloatField(default=0)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['vendor', 'is_active']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            import uuid
            base_slug = slugify(self.name)
            if not base_slug:
                base_slug = str(uuid.uuid4())[:8]
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Order(BaseModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('razorpay', 'Razorpay'),
        ('stripe', 'Stripe'),
        ('upi_gpay', 'Google Pay'),
        ('upi_phonepe', 'PhonePe'),
        ('upi_paytm', 'Paytm'),
        ('upi_bhim', 'BHIM'),
        ('upi_amazon', 'Amazon Pay'),
        ('bank_transfer', 'Bank Transfer'),
    ]

    buyer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES)
    payment_id = models.CharField(max_length=200, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_address = models.TextField()
    shipping_phone = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['buyer', 'status']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"Order {self.order_number} — {self.buyer.username}"


class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_applied = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = 'order_items'

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"


class PaymentTransaction(BaseModel):
    STATUS_CHOICES = [
        ('initiated', 'Initiated'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    gateway = models.CharField(max_length=30)
    gateway_order_id = models.CharField(max_length=200, blank=True)
    gateway_payment_id = models.CharField(max_length=200, blank=True)
    gateway_signature = models.CharField(max_length=500, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='initiated')
    response_data = models.JSONField(default=dict)

    class Meta:
        db_table = 'payment_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.gateway} — {self.status} — {self.amount}"


class DataListing(BaseModel):
    """
    A verified contribution offered for sale on the data marketplace.

    Eligibility: the contributor must have >= 25 verified contributions
    (marketplace_eligible on ContributionScore) before a listing can be
    created, and the contribution type must be marketplace_eligible.
    """

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('available', 'Available'),
        ('sold', 'Sold'),
        ('withdrawn', 'Withdrawn'),
    ]

    contribution = models.OneToOneField(
        'contributions.Contribution',
        on_delete=models.CASCADE,
        related_name='data_listing',
    )
    seller = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='data_listings'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price_inr = models.DecimalField(
        max_digits=10, decimal_places=2, help_text='Fixed price from Contribution_Catalogue'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    license_type = models.CharField(
        max_length=80, default='Non-exclusive data licence'
    )
    listed_at = models.DateTimeField(null=True, blank=True)
    sold_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'data_listings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'price_inr']),
            models.Index(fields=['seller', 'status']),
        ]

    def __str__(self):
        return f"{self.title} — ₹{self.price_inr} ({self.status})"


class DataSale(BaseModel):
    """
    A completed (or pending) sale of a contributor's data item.
    This is what feeds 'how much they earned' on the scoreboard.
    """

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    listing = models.ForeignKey(
        DataListing, on_delete=models.CASCADE, related_name='sales'
    )
    contribution = models.ForeignKey(
        'contributions.Contribution', on_delete=models.CASCADE, related_name='data_sales'
    )
    seller = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='data_sales_received'
    )
    buyer = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='data_purchases',
    )
    buyer_name = models.CharField(max_length=150, blank=True, help_text='Researcher / agency / anonymous label')
    gross_inr = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    contributor_earning_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='INR')
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending', db_index=True
    )
    license_type = models.CharField(max_length=80, default='Non-exclusive data licence')
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'data_sales'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['seller', 'payment_status']),
            models.Index(fields=['payment_status', 'paid_at']),
        ]

    def __str__(self):
        return f"{self.contribution_id} — ₹{self.contributor_earning_inr} ({self.payment_status})"

    def save(self, *args, **kwargs):
        if not self.contributor_earning_inr and self.gross_inr and self.platform_fee_inr is not None:
            self.contributor_earning_inr = self.gross_inr - self.platform_fee_inr
        super().save(*args, **kwargs)


class AgencyReferral(BaseModel):
    """
    Surveillance-relevant maritime information is NOT publicly priced or listed.
    It goes through an agency referral + authorised human review (Navy / Coast Guard).
    """

    AGENCY_CHOICES = [
        ('navy', 'Indian Navy'),
        ('coast_guard', 'Indian Coast Guard'),
        ('other', 'Other authorised agency'),
    ]

    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('under_review', 'Under authorised review'),
        ('referred', 'Referred to agency'),
        ('acknowledged', 'Agency acknowledged'),
        ('rewarded', 'Reward assisted'),
        ('rejected', 'Not referred'),
    ]

    contribution = models.OneToOneField(
        'contributions.Contribution',
        on_delete=models.CASCADE,
        related_name='agency_referral',
    )
    contributor = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='agency_referrals'
    )
    agency = models.CharField(max_length=30, choices=AGENCY_CHOICES, default='coast_guard')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    referral_reference = models.CharField(max_length=60, blank=True)
    reward_note = models.TextField(
        blank=True,
        help_text='Assisted reward outcome — never a public fixed price',
    )
    reward_inr = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_public = models.BooleanField(
        default=False, help_text='Only the contributor sees referral details'
    )

    class Meta:
        db_table = 'agency_referrals'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.contribution_id} → {self.get_agency_display()} ({self.status})"
