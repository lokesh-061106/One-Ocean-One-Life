from django.contrib import admin
from .models import (
    BusinessIdea, GovernmentScheme, Workshop,
    ShgSection, RevenueItem, LoanScheme, FishProduct, Recipe,
)


@admin.register(BusinessIdea)
class BusinessIdeaAdmin(admin.ModelAdmin):
    list_display = ['title', 'investment_level', 'investment_min', 'investment_max', 'is_active']
    list_filter = ['investment_level', 'is_active']


@admin.register(GovernmentScheme)
class GovernmentSchemeAdmin(admin.ModelAdmin):
    list_display = ['scheme_name', 'authority', 'eligibility_occupation', 'benefit_type', 'deadline', 'is_active']
    list_filter = ['eligibility_occupation', 'state', 'is_active']


@admin.register(Workshop)
class WorkshopAdmin(admin.ModelAdmin):
    list_display = ['title', 'date', 'fee', 'is_free', 'is_active']
    list_filter = ['is_free', 'is_active']


class RevenueItemInline(admin.TabularInline):
    model = RevenueItem
    extra = 0
    ordering = ['sort_order']


@admin.register(ShgSection)
class ShgSectionAdmin(admin.ModelAdmin):
    list_display = ['num', 'key', 'label', 'title', 'tone', 'is_published']
    list_filter = ['is_published', 'tone']
    prepopulated_fields = {'key': ('label',)}
    inlines = [RevenueItemInline]


@admin.register(LoanScheme)
class LoanSchemeAdmin(admin.ModelAdmin):
    list_display = ['name', 'purpose', 'amount', 'sort_order', 'is_active']
    list_filter = ['is_active']


@admin.register(FishProduct)
class FishProductAdmin(admin.ModelAdmin):
    list_display = ['english', 'tamil', 'translit', 'sort_order', 'is_active']
    search_fields = ['english', 'tamil']
    list_filter = ['is_active']


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['fish', 'dish', 'cook', 'sort_order', 'is_active']
    search_fields = ['fish', 'dish']
    list_filter = ['is_active']
