from rest_framework import serializers

from .models import BadgeDefinition, ContributionScore, LeaderboardSnapshot, RecognitionAward, TierThreshold


class RecognitionAwardSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    zone_name = serializers.CharField(source='zone.name', read_only=True, default=None)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = RecognitionAward
        fields = ['id', 'user', 'user_name', 'category', 'category_display', 'year', 'title', 'description', 'village', 'village_name', 'zone', 'zone_name', 'score', 'rank']


class ContributionScoreSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.SerializerMethodField()
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    rank_delta = serializers.IntegerField(read_only=True)

    class Meta:
        model = ContributionScore
        fields = [
            'id', 'user', 'user_name', 'display_name', 'slug',
            'total_score', 'profile_score',
            'verified_contributions', 'total_contributions', 'quality_average',
            'breakdown', 'state', 'coastal_region',
            'data_items_sold', 'gross_sales_inr', 'earnings_inr',
            'marketplace_eligible', 'agency_referrals',
            'tier', 'tier_display', 'badges',
            'rank', 'prev_rank', 'rank_movement', 'rank_delta',
            'last_calculated',
        ]

    def get_display_name(self, obj):
        user = obj.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name or user.username


class LeaderboardSerializer(serializers.ModelSerializer):
    """One row of any scoreboard level."""

    user_name = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.SerializerMethodField()
    village_name = serializers.CharField(
        source='user.profile.village.name', read_only=True, default=None
    )
    district_name = serializers.CharField(
        source='user.profile.village.district.name', read_only=True, default=None
    )
    state = serializers.CharField(read_only=True)
    region_name = serializers.CharField(
        source='coastal_region.name', read_only=True, default=None
    )
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    occupation = serializers.CharField(source='user.profile.occupation', read_only=True, default=None)
    rank_delta = serializers.IntegerField(read_only=True)

    class Meta:
        model = ContributionScore
        fields = [
            'rank', 'rank_movement', 'rank_delta', 'prev_rank',
            'user', 'user_name', 'display_name', 'slug', 'occupation',
            'village_name', 'district_name', 'state', 'region_name',
            'total_score', 'profile_score',
            'verified_contributions', 'total_contributions', 'quality_average',
            'data_items_sold', 'gross_sales_inr', 'earnings_inr',
            'marketplace_eligible', 'agency_referrals',
            'tier', 'tier_display', 'badges',
        ]

    def get_display_name(self, obj):
        user = obj.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name or user.username


class TierThresholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = TierThreshold
        fields = ['key', 'name', 'min_verified', 'min_points', 'color', 'icon', 'unlocks', 'order']


class BadgeDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BadgeDefinition
        fields = ['key', 'name', 'description', 'icon', 'color', 'criteria']


class LeaderboardSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaderboardSnapshot
        fields = [
            'level', 'scope_key', 'scope_label',
            'subject_id', 'subject_name', 'rank', 'total_score',
            'earnings_inr', 'captured_on',
        ]
