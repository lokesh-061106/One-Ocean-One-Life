from django.contrib.auth import get_user_model
from rest_framework import serializers
from locations.models import Village
from .models import EducationCategory, EducationPost, EducationPostImage

User = get_user_model()


class EducationCategorySerializer(serializers.ModelSerializer):
    post_count = serializers.IntegerField(source='posts.count', read_only=True)

    class Meta:
        model = EducationCategory
        fields = ['id', 'name', 'name_tamil', 'slug', 'icon', 'description', 'post_count']


class EducationAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'is_verified']


class EducationVillageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Village
        fields = ['id', 'name', 'slug']


class EducationPostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationPostImage
        fields = ['id', 'image', 'caption', 'sort_order']


class EducationPostListSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    images = EducationPostImageSerializer(many=True, read_only=True)

    class Meta:
        model = EducationPost
        fields = ['id', 'title', 'slug', 'content', 'post_type', 'category', 'author', 'author_name', 'village', 'village_name', 'image', 'images', 'is_verified', 'reactions_count', 'views_count', 'created_at']

    def get_author_name(self, obj):
        if not obj.author:
            return None
        return obj.author.get_full_name() or obj.author.username


class EducationPostDetailSerializer(serializers.ModelSerializer):
    author = EducationAuthorSerializer(read_only=True)
    author_name = serializers.SerializerMethodField()
    village = EducationVillageSerializer(read_only=True)
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    category = EducationCategorySerializer(read_only=True)
    images = EducationPostImageSerializer(many=True, read_only=True)

    class Meta:
        model = EducationPost
        fields = '__all__'

    def get_author_name(self, obj):
        if not obj.author:
            return None
        return obj.author.get_full_name() or obj.author.username


class EducationPostCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(child=serializers.ImageField(), required=False, write_only=True)

    class Meta:
        model = EducationPost
        fields = ['title', 'content', 'post_type', 'category', 'village', 'image', 'images']

    def create(self, validated_data):
        gallery = validated_data.pop('images', [])
        validated_data['author'] = self.context['request'].user
        post = super().create(validated_data)
        for order, file in enumerate(gallery):
            EducationPostImage.objects.create(post=post, image=file, sort_order=order)
        return post
