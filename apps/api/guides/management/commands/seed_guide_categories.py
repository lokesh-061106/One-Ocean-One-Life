"""Seed / repair guide categories: icons plus any missing descriptive fields.

Usage:
    python manage.py seed_guide_categories          # fill empty fields only
    python manage.py seed_guide_categories --force  # overwrite icon/description too
"""

from django.core.management.base import BaseCommand
from django.utils.text import slugify
from guides.models import GuideCategory

PRIMARY_CATEGORIES = [
    {
        "name": "Fishing Practices to Protect Sea Turtles and Marine Mammals in Indian Seas",
        "slug": "fishing-practices-to-protect-sea-turtles-and-marin",
        "icon": "🐢",
        "name_tamil": "இந்தியக் கடற்பகுதிகளில் கடல் ஆமைகள் மற்றும் கடல்வாழ் பாலூட்டிகளைப் பாதுகாப்பதற்கான மீன்பிடி முறைகள்",
        "description": (
            "In Indian seas, the incidental capture of non-target species (bycatch) in commercial and "
            "artisanal fisheries poses a severe threat to sea turtles (like the Olive Ridley, Green, and "
            "Leatherback) and marine mammals (such as dolphins, porpoises, and dugongs)."
        ),
        "sort_order": 1,
    },
    {
        "name": "Laws, Rules and Policies",
        "slug": "laws-rules-and-policies",
        "icon": "📜",
        "name_tamil": "சட்டங்கள், விதிகள் மற்றும் கொள்கைகள்",
        "description": (
            "Laws, rules, and policies form the framework that governs coastal and marine activity in "
            "India. They differ in their authority, scope, and consequences, and together they guide how "
            "fisheries, conservation and coastal development are managed."
        ),
        "sort_order": 2,
    },
    {
        "name": "Marine Mammal–Fisheries Interaction Management in India",
        "slug": "marine-mammalfisheries-interaction-management-in-i",
        "icon": "🐬",
        "name_tamil": "இந்தியாவில் கடல்சார் பாலூட்டிகள் மற்றும் மீன்பிடித் தொழில் இடையிலான இடைவினை மேலாண்மை",
        "description": (
            "Marine mammal-fisheries interaction management in India addresses accidental bycatch, gear "
            "damage and depredation — particularly in gillnet and purse seine fisheries — while protecting "
            "vulnerable species under the Wildlife (Protection) Act, 1972."
        ),
        "sort_order": 3,
    },
    {
        "name": "Marine & Fisheries Science Centers in Southern India",
        "slug": "marine-fisheries-science-centers-in-southern-india",
        "icon": "🔬",
        "name_tamil": "தென்னிந்தியாவில் உள்ள கடல்சார் மற்றும் மீன்வள அறிவியல் மையங்கள்",
        "description": (
            "Southern India is a global hub for marine biology, mariculture and sustainable fishing "
            "research. The primary institutes in this sector work under the Indian Council of Agricultural "
            "Research (ICAR) and the Ministry of Earth Sciences, along with several elite regional hubs."
        ),
        "sort_order": 4,
    },
]

# Used for any other category that is missing an icon.
ICON_BY_SLUG = {
    "marine-mammals": "🐋",
    "fish": "🐟",
    "sharks-rays": "🐙",
    "sea-turtles": "🐢",
    "seabirds": "🐦",
    "coral": "🪸",
    "mangroves": "🌲",
    "seagrass": "🌿",
    "coastal-habitats": "🏖",
    "habitats": "🌊",
}
DEFAULT_ICON = "📚"


class Command(BaseCommand):
    help = "Add icons and fill missing data for guide categories."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite icon/description/name_tamil even when they already have a value.",
        )

    def handle(self, *args, **options):
        force = options["force"]
        created = updated = 0

        for data in PRIMARY_CATEGORIES:
            category, was_created = GuideCategory.objects.get_or_create(
                slug=data["slug"],
                defaults={"name": data["name"]},
            )
            if was_created:
                created += 1
            changed = self._apply(category, data, force)
            if changed:
                updated += 1
            self.stdout.write(
                f"  {'+' if was_created else '~'} {category.name}: icon={category.icon or '(empty)'}"
                f"{' (updated)' if changed else ''}"
            )

        # Any other category without an icon gets a sensible default.
        for category in GuideCategory.objects.all():
            if category.icon:
                continue
            data = {
                "icon": ICON_BY_SLUG.get(category.slug, DEFAULT_ICON),
                "name_tamil": category.name_tamil,
                "description": category.description,
            }
            if not category.slug:
                category.slug = slugify(category.name) or f"category-{category.pk}"
            if self._apply(category, data, force=False):
                updated += 1
                self.stdout.write(f"  ~ {category.name}: icon={category.icon} (icon added)")

        self.stdout.write(self.style.SUCCESS(f"Guide categories: {created} created, {updated} updated."))

    def _apply(self, category, data, force):
        changed = False
        for field in ("name", "icon", "name_tamil", "description", "slug", "sort_order"):
            if field not in data:
                continue
            current = getattr(category, field)
            new = data[field]
            if new and (force or not current):
                if current != new:
                    setattr(category, field, new)
                    changed = True
        if changed or not category.slug:
            category.save()
        return changed
