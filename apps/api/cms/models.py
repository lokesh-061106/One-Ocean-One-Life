from django.db import models


class Page(models.Model):
    slug = models.SlugField(unique=True, help_text="URL-friendly identifier (e.g. 'about', 'privacy', 'terms', 'contact')")
    title = models.CharField(max_length=200)
    meta_description = models.CharField(max_length=300, blank=True, help_text="SEO description")
    hero_title = models.CharField(max_length=300, blank=True)
    hero_subtitle = models.TextField(blank=True)
    hero_image = models.ImageField(upload_to="cms/hero/", blank=True, null=True)
    content = models.TextField(help_text="Main page content (HTML supported)")
    sidebar_content = models.TextField(blank=True, help_text="Optional sidebar content (HTML)")
    is_published = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "title"]

    def __str__(self):
        return self.title


class PageSection(models.Model):
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="sections")
    title = models.CharField(max_length=200)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon name (e.g. 'Shield', 'Globe')")
    content = models.TextField(help_text="Section content (HTML supported)")
    sort_order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "title"]

    def __str__(self):
        return f"{self.page.title} — {self.title}"


class PageFAQ(models.Model):
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="faqs")
    question = models.CharField(max_length=300)
    answer = models.TextField()
    sort_order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.page.title} — {self.question[:60]}"


class ContactInfo(models.Model):
    page = models.OneToOneField(Page, on_delete=models.CASCADE, related_name="contact_info")
    email_main = models.EmailField(blank=True)
    email_support = models.EmailField(blank=True)
    phone_main = models.CharField(max_length=20, blank=True)
    phone_secondary = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    working_hours = models.CharField(max_length=200, blank=True)
    map_lat = models.FloatField(null=True, blank=True)
    map_lng = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Contact Info — {self.page.title}"


class SiteHeaderConfig(models.Model):
    """Singleton controlling which header menu style the storefront renders."""

    MENU_OPTIONS = [("option1", "Option 1 - Split Navigation"), ("option2", "Option 2 - Mega Dropdown"), ("option3", "Option 3 - Tabbed Navigation"), ("option4", "Option 4 - Sidebar + Header"), ("option5", "Option 5 - Document Header")]

    selected_menu_option = models.CharField(max_length=20, choices=MENU_OPTIONS, default="option2")
    show_option1 = models.BooleanField(default=True)
    show_option2 = models.BooleanField(default=True)
    show_option3 = models.BooleanField(default=True)
    show_option4 = models.BooleanField(default=True)
    show_option5 = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site header config"

    def __str__(self):
        return f"Header menu: {self.selected_menu_option}"

    @classmethod
    def get_singleton(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class MenuItem(models.Model):
    """A single storefront navigation link an admin can show/hide and reorder."""

    GROUP_CHOICES = [
        ("explore", "Explore"),
        ("community", "Community"),
        ("marketplace", "Marketplace"),
        ("general", "General"),
    ]

    key = models.SlugField(unique=True, help_text="Stable identifier (e.g. 'ocean-map')")
    label = models.CharField(max_length=100, help_text="Text shown in the navigation")
    href = models.CharField(max_length=200, help_text="Link target (e.g. '/map')")
    group = models.CharField(max_length=20, choices=GROUP_CHOICES, default="general")
    description = models.CharField(max_length=200, blank=True, help_text="Optional subtitle for dropdown menus")
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon name (e.g. 'MapPin')")
    sort_order = models.IntegerField(default=0)
    is_visible = models.BooleanField(default=True, help_text="Hidden items are removed from the storefront navigation")
    is_accent = models.BooleanField(default=False, help_text="Render with the danger/accent style (e.g. Emergency)")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "key"]
        verbose_name = "Menu item"

    def __str__(self):
        return f"{self.label} ({self.href})"
