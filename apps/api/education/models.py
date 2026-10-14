from django.db import models
from django.utils.text import slugify
from core.html_utils import sanitize_html
from core.models import BaseModel


class EducationCategory(BaseModel):
    name = models.CharField(max_length=100)
    name_tamil = models.CharField(max_length=200, blank=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'education_categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class EducationPost(BaseModel):
    CATEGORY_CHOICES = [
        ('story', 'Story'),
        ('blog', 'Blog'),
        ('knowledge', 'Local Knowledge'),
        ('tutorial', 'Tutorial'),
        ('experience', 'Experience'),
        ('observation', 'Observation'),
    ]

    author = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='education_posts')
    category = models.ForeignKey(EducationCategory, on_delete=models.SET_NULL, null=True, related_name='posts')
    contribution = models.OneToOneField(
        'contributions.Contribution', on_delete=models.SET_NULL, null=True, blank=True, related_name='education_post',
    )
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    content = models.TextField()
    post_type = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='blog')
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)
    image = models.ImageField(upload_to='education/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    reactions_count = models.IntegerField(default=0)
    views_count = models.IntegerField(default=0)

    class Meta:
        db_table = 'education_posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post_type', 'is_verified']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if isinstance(self.content, str):
            self.content = sanitize_html(self.content)
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)

    def _generate_slug(self):
        base = slugify(self.title)[:200] or "post"
        slug = base
        suffix = 2
        while EducationPost.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{suffix}"
            suffix += 1
        return slug


class EducationPostImage(BaseModel):
    post = models.ForeignKey(EducationPost, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='education/gallery/')
    caption = models.CharField(max_length=200, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'education_post_images'
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f'{self.post.title} - image {self.sort_order}'
