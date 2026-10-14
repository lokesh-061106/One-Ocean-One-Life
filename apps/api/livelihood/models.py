from django.db import models
from core.models import BaseModel


class BusinessIdea(BaseModel):
    IMPACT_LEVELS = [
        ('low', 'Low Investment'),
        ('medium', 'Medium Investment'),
        ('high', 'High Investment'),
    ]

    title = models.CharField(max_length=300)
    description = models.TextField()
    problem = models.TextField(help_text="What problem does this solve?")
    solution = models.TextField(help_text="How does this solve it?")
    materials = models.TextField(help_text="What materials are needed?")
    investment_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    investment_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    investment_level = models.CharField(max_length=20, choices=IMPACT_LEVELS, default='medium')
    equipment = models.TextField(blank=True)
    skills_required = models.TextField(blank=True)
    possible_customers = models.TextField(blank=True)
    implementation_steps = models.TextField(blank=True)
    environmental_benefit = models.TextField(blank=True)
    risks = models.TextField(blank=True)
    image = models.ImageField(upload_to='livelihood/business/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    related_schemes = models.ManyToManyField('GovernmentScheme', blank=True, related_name='business_ideas')
    case_study_title = models.CharField(max_length=300, blank=True)
    case_study_description = models.TextField(blank=True)

    class Meta:
        db_table = 'business_ideas'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class GovernmentScheme(BaseModel):
    ELIGIBILITY_OCCUPATIONS = [
        ('all', 'All Occupations'),
        ('fisherman', 'Fisherman'),
        ('artisan', 'Artisan'),
        ('farmer', 'Farmer'),
        ('vendor', 'Vendor'),
        ('woman', 'Women'),
        ('sc_st', 'SC/ST'),
        ('student', 'Student'),
    ]

    scheme_name = models.CharField(max_length=300)
    authority = models.CharField(max_length=200, help_text="Government department/authority")
    state = models.CharField(max_length=100, default='Tamil Nadu')
    district = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    eligibility_occupation = models.CharField(max_length=30, choices=ELIGIBILITY_OCCUPATIONS, default='all')
    eligibility_age_min = models.IntegerField(null=True, blank=True)
    eligibility_age_max = models.IntegerField(null=True, blank=True)
    eligibility_description = models.TextField(blank=True, help_text="Additional eligibility criteria")
    documents_required = models.TextField(blank=True, help_text="List of required documents")
    benefit_type = models.CharField(max_length=100, blank=True, help_text="Loan, Subsidy, Grant, Insurance, etc.")
    benefit_amount = models.CharField(max_length=200, blank=True)
    loan_amount = models.CharField(max_length=200, blank=True)
    subsidy_percent = models.CharField(max_length=100, blank=True)
    application_url = models.URLField(blank=True)
    deadline = models.DateField(null=True, blank=True)
    contact_info = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    verified_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'government_schemes'
        ordering = ['scheme_name']
        indexes = [
            models.Index(fields=['eligibility_occupation', 'is_active']),
            models.Index(fields=['state', 'district']),
        ]

    def __str__(self):
        return self.scheme_name


class Workshop(BaseModel):
    title = models.CharField(max_length=300)
    description = models.TextField()
    business_idea = models.ForeignKey(BusinessIdea, on_delete=models.SET_NULL, null=True, blank=True, related_name='workshops')
    organizer = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='organized_workshops')
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateTimeField(null=True, blank=True)
    duration_hours = models.FloatField(null=True, blank=True)
    max_participants = models.IntegerField(null=True, blank=True)
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    skills_taught = models.TextField(blank=True)
    is_free = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'workshops'
        ordering = ['-date']

    def __str__(self):
        return self.title


class ShgSection(BaseModel):
    """One section of the Fisherwomen SHG 'From Waste to Wealth' handbook."""

    key = models.SlugField(max_length=40, unique=True)
    num = models.CharField(max_length=4)
    label = models.CharField(max_length=120)
    title = models.CharField(max_length=300)
    subtitle = models.CharField(max_length=500, blank=True)
    message = models.JSONField(default=list, blank=True, help_text="Corner message card lines")
    slogan = models.CharField(max_length=300, blank=True)
    tagline = models.CharField(max_length=300, blank=True)
    chain = models.JSONField(default=list, blank=True)
    sign = models.CharField(max_length=300, blank=True)
    tone = models.CharField(max_length=20, default='ocean')
    sort_order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        db_table = 'shg_sections'
        ordering = ['sort_order']

    def __str__(self):
        return f"{self.num} — {self.label}"


class RevenueItem(BaseModel):
    """A revenue opportunity row from the 'Revenue Opportunities' section."""

    section = models.ForeignKey(ShgSection, on_delete=models.CASCADE, related_name='revenue_items')
    key = models.SlugField(max_length=40)
    activity = models.CharField(max_length=200)
    what = models.CharField(max_length=300, help_text="What the SHG does")
    market = models.CharField(max_length=300, help_text="Market / customers")
    price = models.CharField(max_length=120, help_text="Selling price, e.g. '₹30–50 per kg'")
    income = models.CharField(max_length=200, help_text="Indicative monthly income")
    image = models.CharField(max_length=300, blank=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'shg_revenue_items'
        ordering = ['sort_order']
        unique_together = [('section', 'activity')]

    def __str__(self):
        return self.activity


class LoanScheme(BaseModel):
    """Government scheme listed on the 'Loans & Financial Support' section."""

    section = models.ForeignKey(ShgSection, on_delete=models.CASCADE, related_name='schemes', null=True, blank=True)
    name = models.CharField(max_length=200, unique=True)
    purpose = models.CharField(max_length=300)
    amount = models.CharField(max_length=160, help_text="Loan amount (approx.)")
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'shg_loan_schemes'
        ordering = ['sort_order']

    def __str__(self):
        return self.name


class FishProduct(BaseModel):
    """A popular South Indian fish with its regional names (fresh fish section)."""

    english = models.CharField(max_length=120, unique=True)
    tamil = models.CharField(max_length=160)
    translit = models.CharField(max_length=160, blank=True)
    names = models.JSONField(default=list, blank=True, help_text="Regional names per language")
    image = models.CharField(max_length=300, blank=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'shg_fish_products'
        ordering = ['sort_order']

    def __str__(self):
        return self.english


class Recipe(BaseModel):
    """A recipe card from the 'Recipes & Food Marketing' section."""

    fish = models.CharField(max_length=120)
    tamil = models.CharField(max_length=160, blank=True)
    translit = models.CharField(max_length=160, blank=True)
    dish = models.CharField(max_length=200)
    ingredients = models.JSONField(default=list, blank=True)
    cook = models.CharField(max_length=200, blank=True)
    serve = models.CharField(max_length=200, blank=True)
    fish_image = models.CharField(max_length=300, blank=True)
    dish_image = models.CharField(max_length=300, blank=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'shg_recipes'
        ordering = ['sort_order']
        unique_together = [('fish', 'dish')]

    def __str__(self):
        return f"{self.fish} — {self.dish}"
