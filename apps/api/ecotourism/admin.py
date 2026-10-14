from django.contrib import admin
from .models import (
    BeachCleanupEvent,
    BeachCleanupPhoto,
    BeachProfile,
    Booking,
    BookingPayout,
    ExperiencePackage,
    FisherFamily,
    LocalBusiness,
    Review,
    SplitRule,
    TourismOpportunity,
)


@admin.register(BeachProfile)
class BeachProfileAdmin(admin.ModelAdmin):
    list_display = ['name', 'district', 'cleanliness', 'safety', 'is_active', 'average_rating']
    list_filter = ['cleanliness', 'safety', 'is_active']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(TourismOpportunity)
class TourismOpportunityAdmin(admin.ModelAdmin):
    list_display = ['name', 'opportunity_type', 'model_category', 'village', 'price_min', 'price_unit', 'is_sustainable', 'rating', 'is_active']
    list_filter = ['model_category', 'opportunity_type', 'is_sustainable', 'is_offshore', 'is_active']
    search_fields = ['name', 'description']
    list_editable = ['is_active']


@admin.register(FisherFamily)
class FisherFamilyAdmin(admin.ModelAdmin):
    list_display = ['name', 'village', 'members_count', 'is_verified', 'rating', 'total_earnings', 'is_active']
    list_filter = ['is_verified', 'is_active']
    search_fields = ['name', 'description']


@admin.register(ExperiencePackage)
class ExperiencePackageAdmin(admin.ModelAdmin):
    list_display = ['title', 'model_category', 'village', 'price', 'duration_text', 'rating', 'is_active']
    list_filter = ['model_category', 'is_active']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}


@admin.register(SplitRule)
class SplitRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'scope', 'provider_pct', 'village_pct', 'platform_pct', 'conservation_pct', 'is_default', 'is_active']
    list_filter = ['is_active', 'is_default']


class BookingPayoutInline(admin.TabularInline):
    model = BookingPayout
    extra = 0
    readonly_fields = ['recipient_type', 'label', 'percentage', 'amount', 'status', 'settled_at']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['booking_ref', 'customer', 'title_display', 'experience_date', 'participants', 'total_amount', 'status', 'payment_status', 'is_lean_season']
    list_filter = ['status', 'payment_status', 'is_lean_season', 'experience_date']
    search_fields = ['booking_ref', 'contact_name', 'contact_phone', 'contact_email']
    readonly_fields = ['booking_ref', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']
    inlines = [BookingPayoutInline]

    @admin.display(description='Listing')
    def title_display(self, obj):
        return obj.title


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['rating', 'user', 'target_label', 'is_verified_stay', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_verified_stay', 'is_approved']
    search_fields = ['comment', 'title']


class BeachCleanupPhotoInline(admin.TabularInline):
    model = BeachCleanupPhoto
    extra = 0
    readonly_fields = ['uploaded_by', 'created_at']


@admin.register(BeachCleanupEvent)
class BeachCleanupEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'beach', 'cleanup_date', 'participants_count', 'waste_collected_kg', 'photos_count']
    list_filter = ['cleanup_date']
    search_fields = ['title', 'slug', 'description']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [BeachCleanupPhotoInline]


@admin.register(BeachCleanupPhoto)
class BeachCleanupPhotoAdmin(admin.ModelAdmin):
    list_display = ['cleanup', 'caption', 'sort_order', 'uploaded_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['cleanup__title', 'caption']


@admin.register(LocalBusiness)
class LocalBusinessAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'village', 'is_sustainable', 'rating']
    list_filter = ['category', 'is_sustainable']
