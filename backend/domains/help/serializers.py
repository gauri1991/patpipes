from rest_framework import serializers
from .models import HelpCategory, HelpArticle


class HelpArticleListSerializer(serializers.ModelSerializer):
    category_slug = serializers.SlugField(source='category.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = HelpArticle
        fields = [
            'id', 'title', 'slug', 'category_slug', 'category_name',
            'excerpt', 'order', 'is_published', 'is_featured', 'tags',
            'author_name', 'view_count', 'created_at', 'updated_at',
        ]

    def get_author_name(self, obj):
        if obj.author:
            name = f'{obj.author.first_name} {obj.author.last_name}'.strip()
            return name or obj.author.username
        return None


class HelpArticleDetailSerializer(serializers.ModelSerializer):
    category_slug = serializers.SlugField(source='category.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = HelpArticle
        fields = [
            'id', 'title', 'slug', 'category_slug', 'category_name',
            'content', 'excerpt', 'order', 'is_published', 'is_featured',
            'tags', 'author_name', 'view_count', 'created_at', 'updated_at',
        ]

    def get_author_name(self, obj):
        if obj.author:
            name = f'{obj.author.first_name} {obj.author.last_name}'.strip()
            return name or obj.author.username
        return None


class HelpArticleWriteSerializer(serializers.ModelSerializer):
    category_slug = serializers.SlugField(write_only=True)

    class Meta:
        model = HelpArticle
        fields = [
            'title', 'slug', 'category_slug', 'content', 'excerpt',
            'order', 'is_published', 'is_featured', 'tags',
        ]

    def validate_category_slug(self, value):
        try:
            return HelpCategory.objects.get(slug=value)
        except HelpCategory.DoesNotExist:
            raise serializers.ValidationError('Category not found.')

    def create(self, validated_data):
        validated_data['category'] = validated_data.pop('category_slug')
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'category_slug' in validated_data:
            validated_data['category'] = validated_data.pop('category_slug')
        return super().update(instance, validated_data)


class HelpCategoryListSerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(
        source='published_article_count', read_only=True
    )

    class Meta:
        model = HelpCategory
        fields = [
            'id', 'name', 'slug', 'description', 'icon',
            'order', 'is_active', 'article_count', 'created_at', 'updated_at',
        ]


class HelpCategoryDetailSerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(
        source='published_article_count', read_only=True
    )
    articles = serializers.SerializerMethodField()

    class Meta:
        model = HelpCategory
        fields = [
            'id', 'name', 'slug', 'description', 'icon',
            'order', 'is_active', 'article_count', 'articles',
            'created_at', 'updated_at',
        ]

    def get_articles(self, obj):
        qs = obj.articles.filter(is_published=True).order_by('order', 'title')
        return HelpArticleListSerializer(qs, many=True).data


class HelpCategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = HelpCategory
        fields = ['name', 'slug', 'description', 'icon', 'order', 'is_active']
