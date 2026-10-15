from django.db import migrations

MENU_ITEMS = [
    {"key": "overview", "label": "Overview", "href": "/", "group": "general", "description": "Platform overview", "icon": "Home", "sort_order": 1, "is_visible": True, "is_accent": False},
    {"key": "guides", "label": "Guides", "href": "/guides", "group": "explore", "description": "Marine species & habitats", "icon": "BookOpen", "sort_order": 2, "is_visible": True, "is_accent": False},
    {"key": "education", "label": "Education", "href": "/education", "group": "explore", "description": "Learn about ocean conservation", "icon": "GraduationCap", "sort_order": 3, "is_visible": True, "is_accent": False},
    {"key": "ocean-map", "label": "Ocean Map", "href": "/map", "group": "explore", "description": "Interactive coastal mapping", "icon": "MapPin", "sort_order": 4, "is_visible": True, "is_accent": False},
    {"key": "ocean-sounds", "label": "Ocean Sounds", "href": "/sounds", "group": "explore", "description": "Citizen-science recordings", "icon": "Mic", "sort_order": 5, "is_visible": True, "is_accent": False},
    {"key": "sightings", "label": "Sightings", "href": "/sightings", "group": "explore", "description": "Marine mammal observations", "icon": "Camera", "sort_order": 6, "is_visible": True, "is_accent": False},
    {"key": "fish-catch", "label": "Fish Catch", "href": "/catches", "group": "explore", "description": "Verified catch records", "icon": "Fish", "sort_order": 7, "is_visible": True, "is_accent": False},
    {"key": "observations", "label": "Observations", "href": "/observations", "group": "explore", "description": "Wildlife & pollution sightings", "icon": "Telescope", "sort_order": 8, "is_visible": True, "is_accent": False},
    {"key": "contributions", "label": "Contributions", "href": "/contributions", "group": "community", "description": "Community observations & guides", "icon": "Award", "sort_order": 9, "is_visible": True, "is_accent": False},
    {"key": "community", "label": "Community", "href": "/community/members", "group": "community", "description": "Connect with members", "icon": "Users", "sort_order": 10, "is_visible": True, "is_accent": False},
    {"key": "events", "label": "Events", "href": "/events", "group": "community", "description": "Coastal events & meetups", "icon": "Calendar", "sort_order": 11, "is_visible": True, "is_accent": False},
    {"key": "clean-ups", "label": "Clean-ups", "href": "/cleanups", "group": "community", "description": "Community beach clean-ups", "icon": "Trash2", "sort_order": 12, "is_visible": True, "is_accent": False},
    {"key": "marketplace", "label": "Marketplace", "href": "/marketplace", "group": "marketplace", "description": "Ocean-friendly products", "icon": "Package", "sort_order": 13, "is_visible": True, "is_accent": False},
    {"key": "ecotourism", "label": "Ecotourism", "href": "/ecotourism", "group": "marketplace", "description": "Sustainable coastal tourism", "icon": "Waves", "sort_order": 14, "is_visible": True, "is_accent": False},
    {"key": "economy", "label": "Economy", "href": "/economy", "group": "marketplace", "description": "Sustainable livelihoods", "icon": "Recycle", "sort_order": 15, "is_visible": True, "is_accent": False},
    {"key": "recognition", "label": "Recognition", "href": "/recognition", "group": "community", "description": "Top contributors", "icon": "Trophy", "sort_order": 16, "is_visible": True, "is_accent": False},
    {"key": "emergency", "label": "Emergency", "href": "/emergency", "group": "general", "description": "Emergency contacts & alerts", "icon": "AlertTriangle", "sort_order": 17, "is_visible": True, "is_accent": True},
]


def seed_menu_items(apps, schema_editor):
    MenuItem = apps.get_model("cms", "MenuItem")
    if MenuItem.objects.exists():
        return
    for item in MENU_ITEMS:
        MenuItem.objects.create(**item)


def unseed_menu_items(apps, schema_editor):
    MenuItem = apps.get_model("cms", "MenuItem")
    keys = [item["key"] for item in MENU_ITEMS]
    MenuItem.objects.filter(key__in=keys).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("cms", "0004_menuitem"),
    ]

    operations = [
        migrations.RunPython(seed_menu_items, unseed_menu_items),
    ]
