import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class HelpCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, help_text='Lucide icon name')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'help_categories'
        ordering = ['order', 'name']
        verbose_name_plural = 'Help categories'

    def __str__(self):
        return self.name

    @property
    def published_article_count(self):
        return self.articles.filter(is_published=True).count()


class HelpArticle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=300)
    category = models.ForeignKey(
        HelpCategory,
        on_delete=models.CASCADE,
        related_name='articles',
    )
    content = models.TextField(help_text='Markdown content')
    excerpt = models.TextField(max_length=500, blank=True)
    order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='help_articles',
    )
    view_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'help_articles'
        ordering = ['order', 'title']
        unique_together = ['category', 'slug']
        indexes = [
            models.Index(fields=['is_published']),
            models.Index(fields=['category', 'is_published']),
        ]

    def __str__(self):
        return self.title
