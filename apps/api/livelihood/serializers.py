from rest_framework import serializers
from .models import (
    BusinessIdea, GovernmentScheme, Workshop,
    ShgSection, RevenueItem, LoanScheme, FishProduct, Recipe,
)


class BusinessIdeaListSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessIdea
        fields = [
            'id', 'title', 'description', 'problem', 'investment_level',
            'investment_min', 'investment_max', 'environmental_benefit',
            'image', 'is_active', 'created_at',
        ]


class BusinessIdeaDetailSerializer(serializers.ModelSerializer):
    schemes = serializers.SerializerMethodField()

    class Meta:
        model = BusinessIdea
        fields = '__all__'

    def get_schemes(self, obj):
        from .serializers import GovernmentSchemeListSerializer
        return GovernmentSchemeListSerializer(obj.related_schemes.all(), many=True).data


class BusinessIdeaCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessIdea
        fields = [
            'title', 'description', 'problem', 'solution', 'materials',
            'investment_min', 'investment_max', 'investment_level',
            'equipment', 'skills_required', 'possible_customers',
            'implementation_steps', 'environmental_benefit', 'risks',
            'image', 'is_active', 'case_study_title', 'case_study_description',
        ]


class GovernmentSchemeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = GovernmentScheme
        fields = [
            'id', 'scheme_name', 'authority', 'state', 'district',
            'eligibility_occupation', 'benefit_type', 'benefit_amount',
            'application_url', 'deadline', 'is_active',
        ]


class GovernmentSchemeDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = GovernmentScheme
        fields = '__all__'


class GovernmentSchemeCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GovernmentScheme
        fields = [
            'scheme_name', 'authority', 'state', 'district', 'description',
            'eligibility_occupation', 'eligibility_age_min', 'eligibility_age_max',
            'eligibility_description', 'documents_required', 'benefit_type',
            'benefit_amount', 'loan_amount', 'subsidy_percent',
            'application_url', 'deadline', 'contact_info', 'is_active',
        ]


class WorkshopListSerializer(serializers.ModelSerializer):
    business_title = serializers.CharField(source='business_idea.title', read_only=True, default=None)

    class Meta:
        model = Workshop
        fields = [
            'id', 'title', 'business_title', 'date', 'duration_hours',
            'max_participants', 'fee', 'is_free', 'is_active',
        ]


class WorkshopDetailSerializer(serializers.ModelSerializer):
    business_idea = BusinessIdeaListSerializer(read_only=True)

    class Meta:
        model = Workshop
        fields = '__all__'


class WorkshopCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workshop
        fields = [
            'title', 'description', 'business_idea', 'organizer', 'village',
            'date', 'duration_hours', 'max_participants', 'fee',
            'skills_taught', 'is_free', 'is_active',
        ]


class ShgSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShgSection
        fields = [
            'id', 'key', 'num', 'label', 'title', 'subtitle', 'message',
            'slogan', 'tagline', 'chain', 'sign', 'tone', 'sort_order',
            'is_published',
        ]


class RevenueItemSerializer(serializers.ModelSerializer):
    section_key = serializers.CharField(source='section.key', read_only=True)

    class Meta:
        model = RevenueItem
        fields = [
            'id', 'section_key', 'key', 'activity', 'what', 'market',
            'price', 'income', 'image', 'sort_order', 'is_active',
        ]


class LoanSchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanScheme
        fields = ['id', 'name', 'purpose', 'amount', 'sort_order', 'is_active']


class FishProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = FishProduct
        fields = [
            'id', 'english', 'tamil', 'translit', 'names', 'image',
            'sort_order', 'is_active',
        ]


class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = [
            'id', 'fish', 'tamil', 'translit', 'dish', 'ingredients',
            'cook', 'serve', 'fish_image', 'dish_image', 'sort_order',
            'is_active',
        ]
