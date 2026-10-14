import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = "Seed superuser + all O3L data (locations, guides, education, contributions, etc.)"

    def add_arguments(self, parser):
        parser.add_argument("--skip-superuser", action="store_true", help="Skip creating superuser")
        parser.add_argument("--refresh-education", action="store_true", help="Overwrite existing education posts with the seeded content")

    def handle(self, *args, **options):
        if not options["skip_superuser"]:
            self._create_superuser()
        self._create_users()
        self._create_locations()
        self._create_guides()
        self._create_education(refresh=options["refresh_education"])
        self._create_contributions()
        self._create_community()
        self._create_maps_and_emergency()
        self._create_recognition()
        self._create_marketplace()
        self._create_sounds_and_sightings()
        self._create_livelihood()
        self._create_notifications()
        self.stdout.write(self.style.SUCCESS("All seed data created successfully!"))

    def _create_superuser(self):
        if User.objects.filter(username="admin").exists():
            self.stdout.write("Superuser 'admin' already exists, skipping.")
            return
        User.objects.create_superuser(
            username="admin",
            email="admin@o3l.org",
            password="admin123",
            first_name="Admin",
            last_name="User",
            role="SUPER_ADMIN",
            is_verified=True,
            preferred_language="en",
        )
        self.stdout.write(self.style.SUCCESS("Created superuser: admin / admin123"))

    def _create_users(self):
        users_data = [
            {"username": "arumugam", "email": "arumugam@o3l.org", "first_name": "Arumugam", "last_name": "K", "role": "FISHERMAN", "phone": "+919876543210", "is_verified": True},
            {"username": "lakshmi", "email": "lakshmi@o3l.org", "first_name": "Lakshmi", "last_name": "R", "role": "COMMUNITY_MEMBER", "phone": "+919876543211", "is_verified": True},
            {"username": "kumar", "email": "kumar@o3l.org", "first_name": "Kumar", "last_name": "S", "role": "FISHERMAN", "phone": "+919876543212", "is_verified": True},
            {"username": "priya", "email": "priya@o3l.org", "first_name": "Priya", "last_name": "M", "role": "EDUCATOR", "phone": "+919876543213", "is_verified": True},
            {"username": "meena", "email": "meena@o3l.org", "first_name": "Meena", "last_name": "D", "role": "COMMUNITY_MEMBER", "phone": "+919876543214", "is_verified": True},
            {"username": "rajan", "email": "rajan@o3l.org", "first_name": "Rajan", "last_name": "V", "role": "FISHERMAN", "phone": "+919876543215", "is_verified": True},
            {"username": "dr_vetrimani", "email": "vetrimani@o3l.org", "first_name": "Dr. Vetrimani", "last_name": "P", "role": "SCIENTIFIC_VALIDATOR", "phone": "+919876543216", "is_verified": True},
            {"username": "ngo_sea", "email": "ngo@seaclean.org", "first_name": "Ocean", "last_name": "Watch NGO", "role": "NGO", "phone": "+919876543217", "is_verified": True},
            {"username": "tour_guide", "email": "tour@poompuhar.com", "first_name": "Ravi", "last_name": "Tourism", "role": "TOURISM_PROVIDER", "phone": "+919876543218", "is_verified": True},
            {"username": "researcher", "email": "researcher@o3l.org", "first_name": "Dr. Shankar", "last_name": "N", "role": "RESEARCHER", "phone": "+919876543219", "is_verified": True},
        ]
        created = []
        for data in users_data:
            if not User.objects.filter(username=data["username"]).exists():
                user = User.objects.create_user(
                    password="password123",
                    **data,
                )
                created.append(user)
                self.stdout.write(f"  Created user: {data['username']}")
        return created

    def _get_user(self, username):
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None

    def _create_locations(self):
        from locations.models import Zone, District, Village

        if Zone.objects.exists():
            self.stdout.write("Locations already exist, skipping.")
            return

        zones_data = [
            {"name": "North Coast", "slug": "north-coast", "zone_number": 1, "description": "Northern coastal region of Tamil Nadu including Chennai and surrounding areas."},
            {"name": "North-Central Coast", "slug": "north-central-coast", "zone_number": 2, "description": "North-central coast spanning Cuddalore to Mayiladuthurai."},
            {"name": "Cauvery Delta", "slug": "cauvery-delta", "zone_number": 3, "description": "The fertile Cauvery river delta region including Nagapattinam and Thanjavur."},
            {"name": "Gulf of Mannar", "slug": "gulf-of-mannar", "zone_number": 4, "description": "Biodiverse Gulf of Mannar region between India and Sri Lanka."},
            {"name": "Southern Cape", "slug": "southern-cape", "zone_number": 5, "description": "Southernmost tip of India around Kanyakumari."},
        ]
        for z in zones_data:
            Zone.objects.create(**z)
        self.stdout.write("  Created 5 zones")

        districts_data = [
            {"name": "Chennai", "slug": "chennai", "zone": "north-coast", "state": "Tamil Nadu", "population": 7088000, "area_sq_km": 426},
            {"name": "Tiruvallur", "slug": "tiruvallur", "zone": "north-coast", "state": "Tamil Nadu", "population": 3728100, "area_sq_km": 3422},
            {"name": "Cuddalore", "slug": "cuddalore", "zone": "north-central-coast", "state": "Tamil Nadu", "population": 2600880, "area_sq_km": 3144},
            {"name": "Mayiladuthurai", "slug": "mayiladuthurai", "zone": "north-central-coast", "state": "Tamil Nadu", "population": 918356, "area_sq_km": 1172},
            {"name": "Nagapattinam", "slug": "nagapattinam", "zone": "cauvery-delta", "state": "Tamil Nadu", "population": 697069, "area_sq_km": 1282},
            {"name": "Thanjavur", "slug": "thanjavur", "zone": "cauvery-delta", "state": "Tamil Nadu", "population": 2405890, "area_sq_km": 3476},
            {"name": "Tiruvarur", "slug": "tiruvarur", "zone": "cauvery-delta", "state": "Tamil Nadu", "population": 1093190, "area_sq_km": 2167},
            {"name": "Pudukkottai", "slug": "pudukkottai", "zone": "gulf-of-mannar", "state": "Tamil Nadu", "population": 1618345, "area_sq_km": 4663},
            {"name": "Ramanathapuram", "slug": "ramanathapuram", "zone": "gulf-of-mannar", "state": "Tamil Nadu", "population": 1337560, "area_sq_km": 4123},
            {"name": "Thoothukudi", "slug": "thoothukudi", "zone": "gulf-of-mannar", "state": "Tamil Nadu", "population": 1942288, "area_sq_km": 4621},
            {"name": "Tenkasi", "slug": "tenkasi", "zone": "southern-cape", "state": "Tamil Nadu", "population": 1337560, "area_sq_km": 2916},
            {"name": "Tirunelveli", "slug": "tirunelveli", "zone": "southern-cape", "state": "Tamil Nadu", "population": 1658713, "area_sq_km": 3286},
            {"name": "Kanyakumari", "slug": "kanyakumari", "zone": "southern-cape", "state": "Tamil Nadu", "population": 1873742, "area_sq_km": 1684},
            {"name": "Chengalpattu", "slug": "chengalpattu", "zone": "north-coast", "state": "Tamil Nadu", "population": 2540378, "area_sq_km": 3123},
        ]
        for d in districts_data:
            zone = Zone.objects.get(slug=d.pop("zone"))
            District.objects.create(zone=zone, **d)
        self.stdout.write("  Created 14 districts")

        villages_data = [
            {"name": "Nagapattinam", "slug": "nagapattinam", "district": "nagapattinam", "is_coastal": True, "population": 102833, "latitude": 10.7656, "longitude": 79.8420},
            {"name": "Poompuhar", "slug": "poompuhar", "district": "nagapattinam", "is_coastal": True, "population": 25000, "latitude": 11.1497, "longitude": 79.8508},
            {"name": "Tharangambadi", "slug": "tharangambadi", "district": "nagapattinam", "is_coastal": True, "population": 22782, "latitude": 11.0265, "longitude": 79.8580},
            {"name": "Ramanathapuram", "slug": "ramanathapuram", "district": "ramanathapuram", "is_coastal": True, "population": 88881, "latitude": 9.3763, "longitude": 78.8253},
            {"name": "Thoothukudi", "slug": "thoothukudi", "district": "thoothukudi", "is_coastal": True, "population": 237830, "latitude": 8.7642, "longitude": 78.1348},
            {"name": "Kanyakumari", "slug": "kanyakumari", "district": "kanyakumari", "is_coastal": True, "population": 29760, "latitude": 8.0883, "longitude": 77.5385},
            {"name": "Chennai - Besant Nagar", "slug": "besant-nagar", "district": "chennai", "is_coastal": True, "population": 35000, "latitude": 13.0067, "longitude": 80.2669},
            {"name": "Mahabalipuram", "slug": "mahabalipuram", "district": "chengalpattu", "is_coastal": True, "population": 15000, "latitude": 12.6166, "longitude": 80.1992},
            {"name": "Cuddalore", "slug": "cuddalore", "district": "cuddalore", "is_coastal": True, "population": 173636, "latitude": 11.7480, "longitude": 79.7643},
            {"name": "Kapaleeshwarar", "slug": "kapaleeshwarar-temple", "district": "chennai", "is_coastal": False, "population": 10000, "latitude": 13.0339, "longitude": 80.2700},
        ]
        for v in villages_data:
            district = District.objects.get(slug=v.pop("district"))
            Village.objects.create(district=district, **v)
        self.stdout.write("  Created 10 villages")

    def _create_guides(self):
        from guides.models import GuideCategory, GuideSpecies
        from locations.models import Village

        if GuideCategory.objects.exists():
            self.stdout.write("Guides already exist, skipping.")
            return

        categories_data = [
            {"name": "Marine Mammals", "name_tamil": "\u0b95\u0bca\u0bb3\u0bbf \u0baa\u0bc1\u0bb2\u0bbf", "slug": "marine-mammals", "icon": "\U0001f40c", "description": "Dolphins, whales, and other marine mammals found in Tamil Nadu waters.", "sort_order": 1},
            {"name": "Fish", "name_tamil": "\u0bae\u0bc0\u0ba9\u0bcd", "slug": "fish", "icon": "\U0001f41f", "description": "Various fish species found along the Tamil Nadu coast.", "sort_order": 2},
            {"name": "Sharks & Rays", "name_tamil": "\u0b89\u0bb4\u0bc1 \u0b86\u0bb5\u0bc1", "slug": "sharks-rays", "icon": "\U0001f419", "description": "Sharks, rays, and other cartilaginous fish.", "sort_order": 3},
            {"name": "Sea Turtles", "name_tamil": "\u0b95\u0b9f\u0bb1\u0bc8", "slug": "sea-turtles", "icon": "\U0001f422", "description": "Sea turtles that nest along Tamil Nadu coastline.", "sort_order": 4},
            {"name": "Seabirds", "name_tamil": "\u0b95\u0b9f\u0bb2\u0bc8 \u0baa\u0bb1\u0bcd\u0b9a\u0bc1\u0b95\u0bcd\u0b95\u0bb3\u0bcd", "slug": "seabirds", "icon": "\U0001f426", "description": "Coastal and seabirds of the region.", "sort_order": 5},
            {"name": "Coral", "name_tamil": "\u0baa\u0bc0\u0bb5\u0bb1\u0bcd", "slug": "coral", "icon": "\U0001fab8", "description": "Coral reefs and their ecosystems.", "sort_order": 6},
            {"name": "Mangroves", "name_tamil": "\u0bae\u0bc8\u0baf\u0bcd\u0b9f\u0bb5\u0bc1", "slug": "mangroves", "icon": "\U0001f332", "description": "Mangrove forests and their importance.", "sort_order": 7},
            {"name": "Seagrass", "name_tamil": "\u0b95\u0bc6\u0bb8\u0bcd\u0baa\u0bc1 \u0baa\u0bc1\u0bb2\u0bbf", "slug": "seagrass", "icon": "\U0001f33f", "description": "Seagrass meadows and their ecosystems.", "sort_order": 8},
            {"name": "Coastal Habitats", "name_tamil": "\u0b95\u0b9f\u0bb1\u0bca\u0b9f\u0bbf \u0bb5\u0bbe\u0bb4\u0bc1\u0b95\u0bb3\u0bcd", "slug": "coastal-habitats", "icon": "\U0001f3d6", "description": "Coastal and marine habitats.", "sort_order": 9},
        ]
        for c in categories_data:
            GuideCategory.objects.create(**c)
        self.stdout.write("  Created 9 guide categories")

        species_data = [
            {"category": "marine-mammals", "common_name": "Spinner Dolphin", "tamil_name": "\u0b9a\u0bc1\u0ba4\u0bcd\u0ba4\u0bbf \u0b95\u0bca\u0bb3\u0bbf", "scientific_name": "Stenella longirostris", "description": "Small, acrobatic dolphins known for their spinning leaps. Common in deep waters off Tamil Nadu coast.", "habitat": "Deep tropical and subtropical waters, usually beyond the continental shelf edge.", "diet": "Small fish, squid, and shrimp.", "behavior": "Travel in large pods, perform spectacular spinning leaps. Active during dawn and dusk.", "identification": "Slender body, long snout, distinct tri-color pattern with dark back, light sides, and white belly.", "interesting_facts": "Can spin up to 7 revolutions along their longitudinal axis before re-entering the water.", "conservation_status": "LC", "typical_size": "1.3-2.1m", "latitude": 10.5, "longitude": 80.0},
            {"category": "marine-mammals", "common_name": "Humpback Whale", "tamil_name": "\u0bae\u0bc1\u0b9f\u0b9f\u0bca\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0bb2 \u0baa\u0bc6\u0bb5\u0bb1\u0bc1", "scientific_name": "Megaptera novaeangliae", "description": "Large baleen whales known for their complex songs and acrobatic breaching behavior.", "habitat": "Coastal and open ocean waters, migrates between feeding and breeding grounds.", "diet": "Krill and small schooling fish.", "behavior": "Known for haunting songs that can travel hundreds of miles. Breach and slap their tails.", "identification": "Distinctive long pectoral fins, knobby head, and unique tail fluke patterns.", "interesting_facts": "Males produce complex songs that can last for hours and evolve over time.", "conservation_status": "LC", "typical_size": "12-16m", "latitude": 10.8, "longitude": 79.9},
            {"category": "sea-turtles", "common_name": "Green Sea Turtle", "tamil_name": "\u0baa\u0b9a\u0bcd\u0b9a\u0bc8 \u0b95\u0b9f\u0bb1\u0bc8", "scientific_name": "Chelonia mydas", "description": "Large sea turtle found in tropical and subtropical seas. Important for beach nesting along Tamil Nadu coast.", "habitat": "Shallow coastal waters, seagrass beds, and coral reefs.", "diet": "Herbivorous as adults - seagrass and algae.", "behavior": "Nests on sandy beaches, females return to natal beaches. Migrate long distances.", "identification": "Smooth, heart-shaped shell, olive-brown with yellowish edges. Large head.", "interesting_facts": "Females can lay 100-200 eggs in a single nest and return to the same beach to nest.", "conservation_status": "EN", "typical_size": "0.8-1.5m", "latitude": 11.1, "longitude": 79.8},
            {"category": "sharks-rays", "common_name": "Whale Shark", "tamil_name": "\u0baa\u0bc6\u0bb5\u0bb1\u0bc1 \u0b89\u0bb4\u0bc1", "scientific_name": "Rhincodon typus", "description": "The largest fish in the world. Found in warm tropical waters off Tamil Nadu coast.", "habitat": "Open ocean and coastal waters, typically in warm tropical areas.", "diet": "Plankton, fish eggs, and small fish filtered through gill rakers.", "behavior": "Gentle giant, slow swimming. Known to aggregate in predictable locations.", "identification": "Massive flattened head, wide mouth, distinctive spotted pattern.", "interesting_facts": "Can live up to 100 years and grow up to 18 meters long.", "conservation_status": "EN", "typical_size": "4-12m", "latitude": 9.5, "longitude": 79.5},
            {"category": "fish", "common_name": "Clownfish", "tamil_name": "\u0b9a\u0bbf\u0bb0\u0bc1\u0b9f\u0bb2\u0b9a\u0bcd\u0b9a\u0bbf \u0bae\u0bc0\u0ba9\u0bcd", "scientific_name": "Amphiprion ocellaris", "description": "Brightly colored reef fish famous for their symbiotic relationship with sea anemones.", "habitat": "Coral reefs, protected lagoons, and tide pools.", "diet": "Small crustaceans, plankton, algae, and leftover food from anemone.", "behavior": "Live in symbiotic relationship with anemones. Sequential hermaphrodites.", "identification": "Bright orange with three white bands edged in black.", "interesting_facts": "All clownfish are born male, with dominant males changing to female.", "conservation_status": "LC", "typical_size": "7-10cm", "latitude": 10.2, "longitude": 80.1},
            {"category": "seabirds", "common_name": "Brahminy Kite", "tamil_name": "\u0b9a\u0bc6\u0b95\u0bcd\u0b95\u0bb2\u0bbf", "scientific_name": "Haliastur indus", "description": "Medium-sized bird of prey with distinctive chestnut and white plumage, found along coastlines.", "habitat": "Coastal areas, estuaries, and mangroves.", "diet": "Fish, crabs, and carrion.", "behavior": "Soars in thermals, dives to catch prey. Associated with fishing communities.", "identification": "Chestnut body with white head and breast in adults. Dark wingtips.", "interesting_facts": "Considered sacred in Hindu culture, associated with Lord Vishnu's vehicle Garuda.", "conservation_status": "LC", "typical_size": "40-55cm wingspan 115cm", "latitude": 10.7, "longitude": 79.8},
        ]
        for s in species_data:
            cat = GuideCategory.objects.get(slug=s.pop("category"))
            GuideSpecies.objects.create(category=cat, is_verified=True, **s)
        self.stdout.write("  Created 6 guide species")

    def _create_education(self, refresh=False):
        from education.models import EducationCategory, EducationPost, EducationPostImage
        from locations.models import Village
        self._create_users()

        if EducationCategory.objects.exists():
            self.stdout.write("Education categories already exist, skipping categories.")
        else:
            categories_data = [
                {"name": "Local Knowledge", "name_tamil": "\u0b93\u0bb3\u0bcd\u0bb3\u0bc8\u0b95\u0bcd \u0b9a\u0bbf\u0bb0\u0ba8\u0bcd\u0ba4\u0bc8", "slug": "local-knowledge", "icon": "\U0001f4da", "description": "Traditional knowledge from fishing communities."},
                {"name": "Conservation", "name_tamil": "\u0b9a\u0bc2\u0bb1\u0bb4\u0bbf\u0b95\u0bcd\u0b95\u0bae\u0bcd", "slug": "conservation", "icon": "\U0001f331", "description": "Marine conservation techniques and knowledge."},
                {"name": "Tutorial", "name_tamil": "\u0b95\u0bb1\u0bcd\u0b9a\u0bbf", "slug": "tutorial", "icon": "\U0001f4cb", "description": "Step-by-step guides and tutorials."},
                {"name": "Education", "name_tamil": "\u0b95\u0bb2\u0bcd\u0bb5\u0bbf\u0baa\u0bcd\u0baa\u0bc1", "slug": "education", "icon": "\U0001f393", "description": "Educational content for all ages."},
                {"name": "Experience", "name_tamil": "\u0b85\u0ba9\u0bc1\u0baa\u0b9a\u0bc1", "slug": "experience", "icon": "\U0001f30a", "description": "Personal experiences from the sea."},
            ]
            for c in categories_data:
                EducationCategory.objects.create(**c)
            self.stdout.write("  Created 5 education categories")

        posts_data = [
            {
                "author": "arumugam", "category": "local-knowledge", "village": "nagapattinam",
                "image": "education/traditional-fishing-nets.jpg",
                "gallery": [
                    ("education/gallery/net-mending-dawn.jpg", "Mending the shore net at dawn"),
                    ("education/gallery/cast-net-haul.jpg", "Hauling the cast net in shallow water"),
                ],
                "title": "Traditional Fishing Nets of Nagapattinam",
                "post_type": "story", "is_verified": True, "reactions_count": 89, "views_count": 1245,
                "content": (
                    "<p>For generations, the fishermen of <strong>Nagapattinam</strong> have used specific net designs suited to our coastal waters. The knowledge of which net to cast \u2014 and when \u2014 is never written down; it travels from father to son along the harbour road.</p>"
                    "<img src=\"/media/education/traditional-fishing-nets.jpg\" alt=\"Traditional fishing nets of Nagapattinam\" />"
                    "<h2>The two nets of our shore</h2>"
                    "<ul>"
                    "<li><strong>Kattumaram valai</strong> \u2014 a fine-mesh net for the shallow water close to shore, worked by two men wading out at dawn.</li>"
                    "<li><strong>Guhai valai</strong> \u2014 a wider, heavier net taken into deeper water by boat when the current runs strong.</li>"
                    "</ul>"
                    "<h2>Reading the sea before casting</h2>"
                    "<p>Each net demands a different skill set. The elder fishermen read the tide, the colour of the water and the direction of the breeze before deciding what to carry down to the beach. During the monsoon months the guhai valai is preferred, because the stronger current keeps the mouth of the net open.</p>"
                    "<blockquote>When the water turns green and the waves break white, the small net will not hold. Take the guhai out past the second sand bar instead.</blockquote>"
                    "<p>These choices, refined over centuries, are as much a part of our heritage as the boats themselves. Recording them here is our way of making sure the younger generation never has to guess.</p>"
                ),
            },
            {
                "author": "lakshmi", "category": "conservation", "village": "poompuhar",
                "image": "education/sea-turtle-protection.jpg",
                "gallery": [
                    ("education/gallery/marked-nest-beach.jpg", "Nest marked with bamboo poles"),
                    ("education/gallery/hatchlings-to-sea.jpg", "Hatchlings making for the sea"),
                ],
                "title": "How We Protect Sea Turtles",
                "post_type": "story", "is_verified": True, "reactions_count": 156, "views_count": 2340,
                "content": (
                    "<p>Our community in <strong>Poompuhar</strong> has been protecting nesting sea turtles for over a decade. Every year between November and March, Olive Ridley turtles come ashore to lay their eggs on our beach \u2014 and every year our volunteer patrol walks the sand after dark to keep them safe.</p>"
                    "<img src=\"/media/education/sea-turtle-protection.jpg\" alt=\"Community sea turtle protection at Poompuhar\" />"
                    "<h2>What the patrol does</h2>"
                    "<ol>"
                    "<li>Walks the 4 km beach stretch from 8 pm to 3 am during nesting season.</li>"
                    "<li>Locates each nest by the mother's flipper tracks and marks it with bamboo poles and a soft rope circle.</li>"
                    "<li>Stops dogs, stray lights and foot traffic from reaching the nest.</li>"
                    "<li>Stays with the nest until the hatchlings emerge, usually 45\u201360 days later, and guides them to the water line.</li>"
                    "</ol>"
                    "<h2>Why it matters</h2>"
                    "<p>Before we began, most nests were dug up by dogs or poachers within a week. Today more than <strong>80% of the nests we mark hatch successfully</strong> \u2014 up from roughly 30% a decade ago. Villagers now report new nests to us instead of disturbing them, which tells me the whole village has become part of this work.</p>"
                    "<p>If you visit between December and February, come walk with us. Bring a red-light torch only \u2014 white light disorients both the mothers and the hatchlings.</p>"
                ),
            },
            {
                "author": "kumar", "category": "tutorial", "village": "ramanathapuram",
                "image": "education/sustainable-fishing-boat.jpg",
                "gallery": [
                    ("education/gallery/hull-frames-shaping.jpg", "Shaping the hull frames"),
                    ("education/gallery/vallam-launch-day.jpg", "Launch day for the finished vallam"),
                ],
                "title": "Building a Sustainable Fishing Boat",
                "post_type": "tutorial", "is_verified": True, "reactions_count": 67, "views_count": 890,
                "content": (
                    "<p>Traditional boat-building techniques use locally sourced materials and are naturally sustainable. In this tutorial I share the process of building a <strong>vallam</strong> (traditional fishing boat) using the method my grandfather taught me in <strong>Ramanathapuram</strong>.</p>"
                    "<img src=\"/media/education/sustainable-fishing-boat.jpg\" alt=\"Traditional vallam boat under construction\" />"
                    "<h2>Step 1 \u2014 Choose the timber</h2>"
                    "<p>Selecting the right wood is the whole battle. <em>Portia tree</em> (Thattampoochi) is ideal for hull planking because it resists water naturally and does not need chemical treatment. Teak is used for the frames where strength matters most.</p>"
                    "<h2>Step 2 \u2014 Shape the hull</h2>"
                    "<ul>"
                    "<li>Mark the keel and cut the frames to the curve of the pattern board.</li>"
                    "<li>Steam-bend the planks so they take the hull curve without cracking.</li>"
                    "<li>Fasten plank to frame with brass or stainless fastenings \u2014 never plain iron, which rusts and stains the wood.</li>"
                    "</ul>"
                    "<h2>Step 3 \u2014 Seal and launch</h2>"
                    "<p>Pay the seams with cotton and pine tar, then give the hull two coats of fish-oil based preservative. A well-built vallam lasts <strong>15\u201320 years</strong> with ordinary care, and every part of it can be repaired on the beach with hand tools.</p>"
                    "<blockquote>A boat you can repair yourself is a boat you will never abandon.</blockquote>"
                ),
            },
            {
                "author": "priya", "category": "education", "village": "besant-nagar",
                "image": "education/ocean-conservation-students.jpg",
                "gallery": [
                    ("education/gallery/classroom-session.jpg", "Ocean conservation class in session"),
                    ("education/gallery/students-beach-cleanup.jpg", "Students clearing the beach"),
                ],
                "title": "Ocean Conservation for Students",
                "post_type": "blog", "is_verified": True, "reactions_count": 201, "views_count": 3100,
                "content": (
                    "<p>This guide introduces marine conservation concepts for school students along the Tamil Nadu coast. It covers marine biodiversity, the threats facing ocean health, and how young people can make a real difference \u2014 starting in their own neighbourhood.</p>"
                    "<img src=\"/media/education/ocean-conservation-students.jpg\" alt=\"Ocean conservation lessons for students\" />"
                    "<h2>Module 1 \u2014 Why the ocean matters</h2>"
                    "<p>Every second breath we take comes from oxygen produced by marine plankton. Students map the journey of a single drop of water from the Cauvery delta out to the Bay of Bengal, and trace how plastic thrown on one street can reach a turtle in the open sea.</p>"
                    "<h2>Module 2 \u2014 Know the species</h2>"
                    "<ul>"
                    "<li>Identify ten common shore birds and five intertidal creatures using only a field notebook.</li>"
                    "<li>Learn the difference between a living coral fragment and a dead one.</li>"
                    "<li>Record one species sighting each week and add it to the class log.</li>"
                    "</ul>"
                    "<h2>Module 3 \u2014 Act locally</h2>"
                    "<ol>"
                    "<li><strong>Beach cleanup planning</strong> \u2014 count and categorise waste, then present the data to the local council.</li>"
                    "<li><strong>Species identification exercises</strong> \u2014 teams compete to log the most verified sightings.</li>"
                    "<li><strong>Community awareness projects</strong> \u2014 students design posters in Tamil and English for the harbour market.</li>"
                    "</ol>"
                    "<p>All three modules fit inside a single school term and need nothing more than a notebook, a camera and a stretch of beach.</p>"
                ),
            },
            {
                "author": "meena", "category": "experience", "village": "kanyakumari",
                "image": "education/seaweed-farming.jpg",
                "gallery": [
                    ("education/gallery/seedlings-on-rope.jpg", "Seedlings tied along the rope lines"),
                    ("education/gallery/seaweed-drying-yard.jpg", "Fresh seaweed drying in the yard"),
                ],
                "title": "Seaweed Farming in Tamil Nadu",
                "post_type": "experience", "is_verified": True, "reactions_count": 112, "views_count": 1567,
                "content": (
                    "<p>Seaweed farming has become an important livelihood for women in our coastal villages. In <strong>Kanyakumari</strong> and Ramanathapuram districts, over 5,000 women are now involved in seaweed cultivation \u2014 a trade that needs no boat, no fuel and very little capital.</p>"
                    "<img src=\"/media/education/seaweed-farming.jpg\" alt=\"Seaweed farming lines in Tamil Nadu\" />"
                    "<h2>How a farm works</h2>"
                    "<ul>"
                    "<li><strong>Seed lines</strong> \u2014 small seaweed fragments are tied onto rope at 20 cm intervals.</li>"
                    "<li><strong>Floats and anchors</strong> \u2014 the rope is stretched between two floating rafts and anchored in 2\u20134 m of water.</li>"
                    "<li><strong>Harvest</strong> \u2014 the cycle takes <strong>45\u201360 days</strong>; a single farming line produces <strong>25\u201330 kg</strong> of fresh seaweed per cycle.</li>"
                    "</ul>"
                    "<h2>What I have learned</h2>"
                    "<p>Water temperature decides everything. When the sea warms past 30\u00b0C the seedlings grow pale and rot, so we shift the rafts into deeper, cooler water. Women's self-help groups share this knowledge openly, which is why the technique has spread so quickly along our coast.</p>"
                    "<blockquote>My first harvest paid for my daughter's school fees. Now our group of twelve sells together and never has to negotiate alone.</blockquote>"
                    "<p>The dried product goes to food, cosmetics and biofuel buyers in Chennai and Coimbatore. Demand keeps rising, and the sea keeps giving back.</p>"
                ),
            },
            {
                "author": "rajan", "category": "local-knowledge", "village": "thoothukudi",
                "image": "education/monsoon-fishing.jpg",
                "gallery": [
                    ("education/gallery/swell-before-storm.jpg", "Swell building before the storm"),
                    ("education/gallery/boats-moored-monsoon.jpg", "Fleet moored for the monsoon"),
                ],
                "title": "Monsoon Fishing Techniques",
                "post_type": "knowledge", "is_verified": True, "reactions_count": 78, "views_count": 945,
                "content": (
                    "<p>The northeast monsoon (October to December) brings unique fishing opportunities to the <strong>Thoothukudi</strong> coast. During this season certain species move closer to shore, and the techniques that work in summer are useless \u2014 you must fish the way the monsoon fishes.</p>"
                    "<img src=\"/media/education/monsoon-fishing.jpg\" alt=\"Monsoon fishing off the Tamil Nadu coast\" />"
                    "<h2>Species to target</h2>"
                    "<ul>"
                    "<li><strong>Oil sardine</strong> \u2014 follows the plankton bloom close inshore after the first heavy rain.</li>"
                    "<li><strong>Indian mackerel</strong> \u2014 schools in the turbid water just beyond the surf line.</li>"
                    "<li><strong>Penaeid shrimps</strong> \u2014 best worked with bottom set nets in the river mouths.</li>"
                    "</ul>"
                    "<h2>Reading weather and sea</h2>"
                    "<p>We never launch on a wind that has shifted to the north-east overnight. The old rule still holds: <em>if the gulls come in low and the swell loses its clean edge, the weather has already turned</em>. Radar and the state fisheries bulletin confirm what the birds and the swell are telling us.</p>"
                    "<h2>Working the shorter days</h2>"
                    "<ol>"
                    "<li>Set out before first light and be off the water by early afternoon while the sea is still manageable.</li>"
                    "<li>Use the heavier anchor weight \u2014 the monsoon current drags a summer anchor within an hour.</li>"
                    "<li>Dry and repair nets every evening; damp monsoon nets rot fast if they are stacked.</li>"
                    "</ol>"
                    "<p>Monsoon fishing is harder work than summer fishing, but it is also the season that fills the drying yards and pays for the lean months.</p>"
                ),
            },
        ]

        created_count, updated_count, refreshed_count = 0, 0, 0
        for p in posts_data:
            author = self._get_user(p.pop("author"))
            cat = EducationCategory.objects.get(slug=p.pop("category"))
            village_slug = p.pop("village")
            image_name = p.pop("image")
            gallery = p.pop("gallery", [])
            try:
                village = Village.objects.get(slug=village_slug)
            except Village.DoesNotExist:
                village = None

            if not author:
                continue

            post, created = EducationPost.objects.get_or_create(
                title=p["title"],
                defaults={**p, "author": author, "category": cat, "village": village, "image": image_name},
            )
            self._sync_gallery(post, gallery, force=refresh)
            if created:
                created_count += 1
                continue

            if refresh:
                post.author = author
                post.category = cat
                post.village = village
                post.image = image_name
                post.post_type = p["post_type"]
                post.content = p["content"]
                post.is_verified = p["is_verified"]
                post.save()
                refreshed_count += 1
                continue

            changed = False
            if post.village_id is None and village:
                post.village = village
                changed = True
            if not post.image and image_name:
                post.image = image_name
                changed = True
            if changed:
                post.save()
                updated_count += 1

        self.stdout.write(
            f"  Created {created_count} education posts, filled village/image on {updated_count}, refreshed {refreshed_count}"
        )

    @staticmethod
    def _sync_gallery(post, gallery, force=False):
        import hashlib
        from education.models import EducationPostImage
        if not gallery:
            return
        wanted = {}
        for order, (path, caption) in enumerate(gallery):
            digest = hashlib.md5(f"{post.slug}:{order}".encode()).hexdigest()[:12]
            pk = f"77777777-7777-7777-7777-{digest}"
            wanted[pk] = (path, caption, order)
        for img in post.images.all():
            if str(img.pk) not in wanted:
                img.delete()
        for pk, (path, caption, order) in wanted.items():
            EducationPostImage.objects.update_or_create(
                pk=pk,
                defaults={"post": post, "image": path, "caption": caption, "sort_order": order},
            )

    def _create_contributions(self):
        from contributions.models import ContributionType, Contribution
        from locations.models import Village

        if ContributionType.objects.exists():
            self.stdout.write("Contribution types already exist, skipping.")
            return

        types_data = [
            {"name": "Ocean Sound Recording", "slug": "ocean-sound", "description": "Record ocean sounds with hydrophone or mobile device.", "points_verified": 20, "points_submitted": 5},
            {"name": "Marine Sighting", "slug": "marine-sighting", "description": "Document marine animal sightings with photos.", "points_verified": 20, "points_submitted": 5},
            {"name": "Education Post", "slug": "education-post", "description": "Share knowledge or stories about marine life.", "points_verified": 10, "points_submitted": 3},
            {"name": "Event", "slug": "event", "description": "Organize or participate in marine events.", "points_verified": 15, "points_submitted": 5},
            {"name": "Beach Cleanup", "slug": "beach-cleanup", "description": "Participate in beach cleanup activities.", "points_verified": 15, "points_submitted": 5},
            {"name": "Local Knowledge", "slug": "local-knowledge", "description": "Share traditional knowledge about marine resources.", "points_verified": 15, "points_submitted": 3},
            {"name": "Observation", "slug": "observation", "description": "General marine observations and data.", "points_verified": 10, "points_submitted": 3},
        ]
        for t in types_data:
            ContributionType.objects.create(**t)
        self.stdout.write("  Created 7 contribution types")

        villages = list(Village.objects.all())
        if not villages:
            return
        from datetime import timezone
        contribs_data = [
            {"username": "arumugam", "type": "ocean_sound", "status": "verified", "village": villages[0], "notes": "Dawn chorus recording near Nagapattinam shore"},
            {"username": "kumar", "type": "marine_sighting", "status": "verified", "village": villages[3], "notes": "Pod of 20 spinner dolphins spotted 2km offshore"},
            {"username": "lakshmi", "type": "beach_cleanup", "status": "verified", "village": villages[1], "notes": "Organized cleanup at Poompuhar beach - 50kg collected"},
            {"username": "meena", "type": "education_post", "status": "verified", "village": villages[4], "notes": "Experience post on seaweed farming"},
            {"username": "rajan", "type": "local_knowledge", "status": "submitted", "village": villages[4], "notes": "Traditional tidal pattern reading knowledge"},
            {"username": "arumugam", "type": "marine_sighting", "status": "submitted", "village": villages[0], "notes": "Green turtle nesting at Nagapattinam beach"},
            {"username": "priya", "type": "observation", "status": "verified", "village": villages[6], "notes": "Coastal erosion pattern near Besant Nagar"},
            {"username": "kumar", "type": "event", "status": "verified", "village": villages[3], "notes": "Fishing techniques workshop organized"},
        ]
        for c in contribs_data:
            user = self._get_user(c.pop("username"))
            if user:
                Contribution.objects.create(user=user, **c)
        self.stdout.write("  Created 8 contributions")

    def _create_community(self):
        from community.models import Event, EventParticipant, CommunityPost
        from locations.models import Village
        self._create_users()

        villages = list(Village.objects.all())
        if not villages:
            return

        events_data = [
            {"title": "Poompuhar Beach Cleanup", "description": "Join us for a community beach cleanup at Poompuhar. Bags and gloves provided. Free lunch for all participants.", "event_type": "cleanup", "village": villages[1], "start_date": datetime.now() + timedelta(days=5), "end_date": datetime.now() + timedelta(days=5, hours=4), "max_participants": 100, "is_published": True},
            {"title": "Marine Species Identification Workshop", "description": "Learn to identify common marine species of Tamil Nadu waters. Bring your camera and curiosity!", "event_type": "workshop", "village": villages[0], "start_date": datetime.now() + timedelta(days=12), "end_date": datetime.now() + timedelta(days=12, hours=3), "max_participants": 30, "is_published": True},
            {"title": "Traditional Fishing Knowledge Sharing", "description": "Elders share traditional fishing techniques, weather reading, and ocean knowledge with the younger generation.", "event_type": "fishing_knowledge", "village": villages[3], "start_date": datetime.now() + timedelta(days=8), "end_date": datetime.now() + timedelta(days=8, hours=2), "max_participants": 50, "is_published": True},
            {"title": "Coastal Conservation Awareness Rally", "description": "Walk for the ocean! Raise awareness about marine conservation in our community.", "event_type": "awareness", "village": villages[4], "start_date": datetime.now() + timedelta(days=20), "end_date": datetime.now() + timedelta(days=20, hours=2), "max_participants": 200, "is_published": True},
            {"title": "Seaweed Farming Training", "description": "Hands-on training for women interested in starting seaweed farming as a livelihood.", "event_type": "education", "village": villages[4], "start_date": datetime.now() + timedelta(days=15), "end_date": datetime.now() + timedelta(days=16), "max_participants": 25, "is_published": True},
        ]
        for e in events_data:
            organizer = self._get_user("ngo_sea") or User.objects.first()
            if organizer:
                event = Event.objects.create(organizer=organizer, **e)
        self.stdout.write("  Created 5 events")

        posts_data = [
            {"author": "arumugam", "title": "Beautiful sunrise at Nagapattinam fishing harbor", "content": "Woke up at 4am today and saw the most incredible sunrise while preparing our boat. The colors reflected on the calm sea were breathtaking.", "category": "experience", "village": villages[0], "is_verified": True, "reactions_count": 45},
            {"author": "lakshmi", "title": "My journey from fishing to conservation", "content": "Growing up in a fishing family, I never imagined I would become a conservation advocate. But witnessing the decline in fish populations changed everything.", "category": "story", "village": villages[1], "is_verified": True, "reactions_count": 78},
            {"author": "kumar", "title": "New sustainable fishing method we are trying", "content": "Our team is experimenting with modified nets that allow juvenile fish to escape. Early results show a 30% increase in sustainable catch.", "category": "knowledge", "village": villages[3], "is_verified": True, "reactions_count": 62},
        ]
        for p in posts_data:
            author = self._get_user(p.pop("author"))
            if author:
                CommunityPost.objects.create(author=author, **p)
        self.stdout.write("  Created 3 community posts")

    def _create_maps_and_emergency(self):
        from django.contrib.gis.geos import Point, Polygon
        from django.utils import timezone as tz
        from maps.models import OceanHotspot, EmergencyContact
        from locations.models import Zone, Village, District

        if OceanHotspot.objects.exists():
            self.stdout.write("Maps/Emergency data already exists, skipping.")
            return

        zones = list(Zone.objects.all())
        villages = list(Village.objects.all())
        districts = list(District.objects.all())

        def make_poly(lon, lat, size=0.1):
            return Polygon([
                (lon - size, lat - size),
                (lon + size, lat - size),
                (lon + size, lat + size),
                (lon - size, lat + size),
                (lon - size, lat - size),
            ])

        hotspot_defs = [
            ("NC-H001", 79.85, 13.00, "high", 45, 8.5, 0),
            ("CD-H002", 79.85, 11.15, "very_high", 78, 9.2, 2),
            ("GM-H003", 78.83, 9.38, "medium", 23, 6.8, 3),
            ("SC-H004", 77.54, 8.09, "low", 8, 4.5, 4),
        ]
        now = tz.now()
        for cell_id, lon, lat, density, count, score, zi in hotspot_defs:
            zone = zones[zi] if zi < len(zones) else zones[0]
            OceanHotspot.objects.create(
                cell_id=cell_id,
                geometry=make_poly(lon, lat),
                center=Point(lon, lat),
                density_level=density,
                contribution_count=count,
                quality_score=score,
                zone=zone,
                last_calculated=now,
            )
        self.stdout.write("  Created 4 hotspots")

        if districts:
            contacts_data = [
                {"name": "Nagapattinam Coast Guard Station", "contact_type": "coast_guard", "phone": "+914365-252001", "village": villages[0] if villages else None, "district": districts[4] if len(districts) > 4 else districts[0], "is_active": True, "address": "Fishing Harbor Road, Nagapattinam 611001"},
                {"name": "Nagapattinam Government Hospital", "contact_type": "hospital", "phone": "+914365-232301", "village": villages[0] if villages else None, "district": districts[4] if len(districts) > 4 else districts[0], "is_active": True, "address": "Hospital Road, Nagapattinam 611001"},
                {"name": "Thoothukudi Port Police", "contact_type": "police", "phone": "+91461-230100", "village": villages[4] if len(villages) > 4 else (villages[0] if villages else None), "district": districts[9] if len(districts) > 9 else districts[0], "is_active": True, "address": "Thoothukudi Port Area"},
                {"name": "Fishermen Safety NGO", "contact_type": "ngo", "phone": "+919876543300", "village": villages[1] if len(villages) > 1 else None, "district": districts[4] if len(districts) > 4 else districts[0], "is_active": True, "address": "Coastal Road, Poompuhar"},
                {"name": "Kanyakumari Disaster Response", "contact_type": "disaster", "phone": "+914652-246300", "village": villages[5] if len(villages) > 5 else None, "district": districts[12] if len(districts) > 12 else districts[0], "is_active": True, "address": "Kanyakumari District Collectorate"},
            ]
            for c in contacts_data:
                if c["village"]:
                    EmergencyContact.objects.create(**c)
            self.stdout.write("  Created 5 emergency contacts")

    def _create_recognition(self):
        from recognition.models import RecognitionAward, ContributionScore
        self._create_users()

        if ContributionScore.objects.exists():
            self.stdout.write("Recognition data already exists, skipping.")
            return

        scores_data = [
            {"username": "arumugam", "total_score": 350, "verified_contributions": 15, "total_contributions": 22, "quality_average": 8.7},
            {"username": "lakshmi", "total_score": 420, "verified_contributions": 18, "total_contributions": 25, "quality_average": 9.1},
            {"username": "kumar", "total_score": 280, "verified_contributions": 12, "total_contributions": 18, "quality_average": 8.2},
            {"username": "priya", "total_score": 310, "verified_contributions": 14, "total_contributions": 20, "quality_average": 8.8},
            {"username": "meena", "total_score": 195, "verified_contributions": 8, "total_contributions": 12, "quality_average": 7.9},
        ]
        for s in scores_data:
            user = self._get_user(s.pop("username"))
            if user:
                ContributionScore.objects.create(user=user, **s)
        self.stdout.write("  Created 5 contribution scores")

        awards_data = [
            {"username": "lakshmi", "category": "community_champion", "year": 2026, "title": "Community Champion 2026", "description": "Outstanding contribution to marine conservation awareness.", "score": 420, "rank": 1},
            {"username": "arumugam", "category": "ocean_observer", "year": 2026, "title": "Top Ocean Observer", "description": "Most verified ocean sound recordings and sightings.", "score": 350, "rank": 2},
            {"username": "priya", "category": "ocean_educator", "year": 2026, "title": "Ocean Educator Award", "description": "Best educational content reaching thousands of students.", "score": 310, "rank": 3},
        ]
        for a in awards_data:
            user = self._get_user(a.pop("username"))
            if user:
                RecognitionAward.objects.create(user=user, **a)
        self.stdout.write("  Created 3 recognition awards")

    def _create_marketplace(self):
        from marketplace.models import ProductCategory, Vendor, Product
        from locations.models import Village

        if ProductCategory.objects.exists():
            self.stdout.write("Marketplace already exists, skipping.")
            return

        cats_data = [
            {"name": "Fishing Equipment", "slug": "fishing-equipment", "icon": "fish", "description": "Nets, hooks, lines, and traditional fishing gear."},
            {"name": "Research Instruments", "slug": "research-instruments", "icon": "search", "description": "Water testing kits, thermometers, and observation tools."},
            {"name": "Safety Products", "slug": "safety-products", "icon": "shield", "description": "Life jackets, first aid kits, and emergency gear."},
            {"name": "Eco Tourism Furniture", "slug": "eco-tourism-furniture", "icon": "tree", "description": "Sustainable bamboo and recycled material furniture."},
            {"name": "Recycled Products", "slug": "recycled-products", "icon": "recycle", "description": "Products made from ocean plastic and recycled materials."},
            {"name": "Marine Equipment", "slug": "marine-equipment", "icon": "anchor", "description": "Boat parts, anchors, and marine hardware."},
        ]
        for c in cats_data:
            ProductCategory.objects.create(**c)
        self.stdout.write("  Created 6 marketplace categories")

        villages = list(Village.objects.all())
        vendors_data = [
            {"username": "arumugam", "shop_name": "Arumugam Fishing Store", "description": "Traditional fishing gear and modern equipment for coastal fishermen.", "village": villages[0] if villages else None, "phone": "+919876543210", "is_verified": True, "rating": 4.5, "total_sales": 340, "latitude": 10.7656, "longitude": 79.8420},
            {"username": "kumar", "shop_name": "Kumar Marine Supplies", "description": "Quality marine equipment and safety gear.", "village": villages[3] if len(villages) > 3 else villages[0], "phone": "+919876543212", "is_verified": True, "rating": 4.2, "total_sales": 210, "latitude": 9.3763, "longitude": 78.8253},
            {"username": "lakshmi", "shop_name": "Lakshmi Eco Crafts", "description": "Handmade recycled products from ocean plastic.", "village": villages[1] if len(villages) > 1 else villages[0], "phone": "+919876543211", "is_verified": True, "rating": 4.8, "total_sales": 180, "latitude": 11.1497, "longitude": 79.8508},
        ]
        vendor_objs = []
        for v in vendors_data:
            user = self._get_user(v.pop("username"))
            if user:
                vendor_objs.append(Vendor.objects.create(user=user, **v))
        self.stdout.write(f"  Created {len(vendor_objs)} vendors")

        products_data = [
            {"vendor": 0, "category": "fishing-equipment", "name": "Traditional Cotton Fishing Net (Valai)", "description": "Hand-woven cotton net suitable for shallow water fishing. Size: 10m x 5m.", "price": 2500, "stock": 50, "is_featured": True, "rating": 4.3, "units_sold": 120},
            {"vendor": 0, "category": "fishing-equipment", "name": "Monofilament Hook Set (50 pcs)", "description": " assorted sizes from 1/0 to 8/0 for various fish species.", "price": 350, "stock": 200, "is_featured": False, "rating": 4.1, "units_sold": 89},
            {"vendor": 1, "category": "safety-products", "name": "Life Jacket - Adult (ISI Certified)", "description": "Coastal approved life jacket for fishermen. Bright orange, high visibility.", "price": 1800, "discount_price": 1500, "stock": 75, "is_featured": True, "rating": 4.7, "units_sold": 67},
            {"vendor": 1, "category": "marine-equipment", "name": "LED Boat Navigation Light", "description": "Waterproof LED navigation light with 3 nautical mile visibility.", "price": 850, "stock": 40, "is_featured": False, "rating": 4.0, "units_sold": 34},
            {"vendor": 2, "category": "recycled-products", "name": "Ocean Plastic Tote Bag", "description": "Durable tote bag made from 100% recycled ocean plastic. Each bag removes 1kg of plastic from the ocean.", "price": 450, "stock": 150, "is_featured": True, "rating": 4.9, "units_sold": 230},
            {"vendor": 2, "category": "recycled-products", "name": "Recycled Rope Coaster Set (4 pcs)", "description": "Handmade coasters from recycled fishing rope. Unique ocean-inspired designs.", "price": 280, "stock": 100, "is_featured": False, "rating": 4.6, "units_sold": 145},
            {"vendor": 0, "category": "research-instruments", "name": "Digital Salinity Refractometer", "description": "Portable refractometer for measuring seawater salinity. Range: 0-100 ppt.", "price": 3200, "stock": 20, "is_featured": True, "rating": 4.4, "units_sold": 18},
            {"vendor": 1, "category": "eco-tourism-furniture", "name": "Bamboo Beach Chair", "description": "Foldable bamboo chair perfect for beach tourism. Sustainable and lightweight.", "price": 1200, "stock": 30, "is_featured": False, "rating": 4.2, "units_sold": 22},
        ]
        for p in products_data:
            vi = p.pop("vendor")
            cat = ProductCategory.objects.get(slug=p.pop("category"))
            if vi < len(vendor_objs):
                Product.objects.create(vendor=vendor_objs[vi], category=cat, **p)
        self.stdout.write(f"  Created {len(products_data)} products")

    def _create_sounds_and_sightings(self):
        from ocean_sounds.models import OceanSound
        from sightings.models import MarineSighting
        from contributions.models import Contribution
        from guides.models import GuideSpecies

        sounds_exist = OceanSound.objects.exists()
        sightings_exist = MarineSighting.objects.exists()
        if sounds_exist and sightings_exist:
            self.stdout.write("Sounds/Sightings already exist, skipping.")
            return

        from django.contrib.gis.geos import Point
        villages = list(Contribution.objects.filter(village__isnull=False).values_list("village", flat=True).distinct())

        if not sounds_exist:
            sound_contribs = Contribution.objects.filter(type="ocean_sound")[:4]
            sounds_data = [
                {"duration_seconds": 180, "written_description": "Dawn chorus recorded near Nagapattinam shore. Clear wave patterns with distant fishing boat engines.", "frequency_range": "20-8000 Hz", "depth_meters": 2.5, "instrument": "Hydrophone", "environmental_conditions": {"wind": "calm", "wave_height": "0.3m"}},
                {"duration_seconds": 240, "written_description": "Underwater recording near coral reef. Snapping shrimp, fish calls, and whale song in background.", "frequency_range": "10-12000 Hz", "depth_meters": 8.0, "instrument": "Underwater Mic", "environmental_conditions": {"wind": "light", "wave_height": "0.5m", "visibility": "12m"}},
                {"duration_seconds": 120, "written_description": "Surface recording during monsoon. Heavy wave action, wind noise, distant thunder.", "frequency_range": "5-6000 Hz", "instrument": "Mobile Device", "environmental_conditions": {"wind": "strong", "wave_height": "2.0m"}},
                {"duration_seconds": 300, "written_description": "Night recording at Poompuhar. Quiet ocean with occasional dolphin echolocation clicks.", "frequency_range": "15-15000 Hz", "depth_meters": 5.0, "instrument": "Hydrophone", "environmental_conditions": {"wind": "calm", "wave_height": "0.2m", "moon_phase": "waxing"}},
            ]
            created_sounds = 0
            for i, contrib in enumerate(sound_contribs):
                if i < len(sounds_data):
                    sd = sounds_data[i]
                    from datetime import date, time
                    OceanSound.objects.create(
                        contribution=contrib,
                        duration_seconds=sd.get("duration_seconds", 60),
                        written_description=sd.get("written_description", ""),
                        frequency_range=sd.get("frequency_range", ""),
                        depth_meters=sd.get("depth_meters"),
                        instrument=sd.get("instrument", "Mobile Device"),
                        environmental_conditions=sd.get("environmental_conditions", {}),
                        recording_date=date.today() - timedelta(days=i * 3),
                        recording_time=time(5 + i, 30),
                    )
                    created_sounds += 1
            self.stdout.write(f"  Created {created_sounds} ocean sounds")

        if not sightings_exist:
            species = list(GuideSpecies.objects.all())
            sighting_contribs = Contribution.objects.filter(type="marine_sighting")[:4]
            sightings_data = [
                {"species_idx": 1, "ai_species_suggestion": "Green Sea Turtle", "ai_confidence": 0.92, "number_observed": 3, "behavior": "feeding", "sea_condition": "calm", "weather": "sunny", "notes": "Three green sea turtles spotted feeding on seagrass beds near Poompuhar."},
                {"species_idx": 0, "ai_species_suggestion": "Spinner Dolphin", "ai_confidence": 0.88, "number_observed": 20, "behavior": "playing", "sea_condition": "moderate", "weather": "partly cloudy", "notes": "Pod of spinner dolphins performing acrobatic leaps about 2km offshore."},
                {"species_idx": 3, "ai_species_suggestion": "Brahminy Kite", "ai_confidence": 0.95, "number_observed": 2, "behavior": "feeding", "sea_condition": "calm", "weather": "clear", "notes": "Two Brahminy Kites fishing near the harbor."},
                {"species_idx": 2, "ai_species_suggestion": "Whale Shark", "ai_confidence": 0.78, "number_observed": 1, "behavior": "traveling", "sea_condition": "calm", "weather": "sunny", "notes": "Juvenile whale shark spotted near the surface."},
            ]
            created_sightings = 0
            for i, contrib in enumerate(sighting_contribs):
                if i < len(sightings_data):
                    sd = sightings_data[i]
                    spec = species[sd["species_idx"]] if sd["species_idx"] < len(species) else None
                    from datetime import date, time
                    MarineSighting.objects.create(
                        contribution=contrib,
                        species=spec,
                        ai_species_suggestion=sd.get("ai_species_suggestion", ""),
                        ai_confidence=sd.get("ai_confidence"),
                        number_observed=sd.get("number_observed", 1),
                        behavior=sd.get("behavior", "unknown"),
                        sea_condition=sd.get("sea_condition", ""),
                        weather=sd.get("weather", ""),
                        notes=sd.get("notes", ""),
                        sighting_date=date.today() - timedelta(days=i * 5),
                        sighting_time=time(6 + i * 2, 0),
                    )
                    created_sightings += 1
            self.stdout.write(f"  Created {created_sightings} marine sightings")

    def _create_livelihood(self):
        from livelihood.models import BusinessIdea, GovernmentScheme, Workshop
        from datetime import datetime, timedelta
        from decimal import Decimal

        if BusinessIdea.objects.exists():
            self.stdout.write("Business ideas already exist, skipping.")
            return

        ideas_data = [
            {"title": "Seaweed Farming", "description": "Cultivate seaweed along the coast for food, cosmetics, and biofuel. Low investment, high demand.", "problem": "Fishermen face declining fish stocks and need alternative income sources.", "solution": "Seaweed farming provides sustainable income with minimal equipment.", "materials": "Seedlings, ropes, floating rafts, anchoring weights", "investment_min": Decimal("5000"), "investment_max": Decimal("25000"), "investment_level": "low", "skills_required": "Basic farming knowledge, swimming ability", "possible_customers": "Food processing companies, cosmetic manufacturers, pharmaceutical companies", "environmental_benefit": "Absorbs CO2, provides marine habitat, requires no freshwater or fertilizer", "risks": "Monsoon damage, seasonal water temperature changes", "case_study_title": "Ramanathapuram Seaweed Farmers", "case_study_description": "Women self-help groups in Ramanathapuram earn ₹15,000-20,000/month from seaweed cultivation."},
            {"title": "Eco-Tourism Boat Tours", "description": "Offer dolphin watching, mangrove tours, and coastal wildlife tours for tourists.", "problem": "Tourism potential along Tamil Nadu coast is underutilized by local communities.", "solution": "Train local fishermen to become eco-tourism guides with their existing boats.", "materials": "Fishing boat (existing), binoculars, life jackets, first aid kit", "investment_min": Decimal("10000"), "investment_max": Decimal("50000"), "investment_level": "medium", "skills_required": "Boat handling, local knowledge, basic English/Hindi speaking", "possible_customers": "Domestic and international tourists, travel agencies, school groups", "environmental_benefit": "Promotes conservation awareness, incentivizes protecting marine life", "risks": "Weather dependency, seasonal tourist flow", "case_study_title": "Mandapam Dolphin Watch", "case_study_description": "Fishermen near Mandapam now earn ₹30,000/month guiding dolphin-watching tours."},
            {"title": "Fish Processing & Value Addition", "description": "Process and package fish products like dried fish, fish pickle, fish powder for wider market reach.", "problem": "Fresh fish prices fluctuate, and fishermen lose income due to lack of cold storage.", "solution": "Value-added fish products have longer shelf life and higher margins.", "materials": "Drying racks, packaging equipment, spices, food-grade containers", "investment_min": Decimal("20000"), "investment_max": Decimal("100000"), "investment_level": "medium", "skills_required": "Food processing, hygiene standards, basic marketing", "possible_customers": "Local markets, supermarkets, online food platforms, restaurants", "environmental_benefit": "Reduces fish waste, promotes sustainable fishing practices", "risks": "Food safety compliance, competition from established brands", "case_study_title": "Nagapattinam Fish Products Co-op", "case_study_description": "A cooperative of 50 fishermen processes and sells fish pickle generating ₹5 lakh monthly revenue."},
            {"title": "Recycled Ocean Plastic Crafts", "description": "Collect ocean plastic waste and transform into sellable products like bags, mats, and jewelry.", "problem": "Ocean plastic pollution threatens marine ecosystems and beaches.", "solution": "Turn waste into income through creative upcycling.", "materials": "Collected ocean plastic, basic tools, molds, dyes", "investment_min": Decimal("3000"), "investment_max": Decimal("15000"), "investment_level": "low", "skills_required": "Craft skills, creativity, basic business management", "possible_customers": "Eco-conscious consumers, gift shops, online marketplaces, corporate gifting", "environmental_benefit": "Removes ocean plastic, raises environmental awareness", "risks": "Market acceptance, inconsistent plastic supply", "case_study_title": "Chennai Ocean Plastic Studio", "case_study_description": "A women-led unit in Chennai converts 200kg of ocean plastic monthly into products sold across India."},
            {"title": "Mangrove Nursery & Restoration", "description": "Grow mangrove seedlings and sell to restoration projects and government programs.", "problem": "Coastal erosion and loss of mangrove forests along Tamil Nadu coast.", "solution": "Commercial mangrove nurseries supply seedlings for large-scale restoration.", "materials": "Mangrove propagules, nursery trays, potting soil, shade nets", "investment_min": Decimal("8000"), "investment_max": Decimal("40000"), "investment_level": "low", "skills_required": "Nursery management, knowledge of local mangrove species", "possible_customers": "Government departments, NGOs, coastal development projects", "environmental_benefit": "Directly restores mangrove ecosystems, prevents coastal erosion", "risks": "Slow growth cycle, government procurement delays", "case_study_title": "Pichavaram Mangrove Nursery", "case_study_description": "A village cooperative near Pichavaram supplies 10,000 mangrove seedlings annually to state restoration programs."},
        ]

        for data in ideas_data:
            BusinessIdea.objects.create(**data)
        self.stdout.write(f"  Created {len(ideas_data)} business ideas")

        schemes_data = [
            {"scheme_name": "Pradhan Mantri Matsya Sampada Yojana (PMMSY)", "authority": "Ministry of Fisheries, Government of India", "description": "Comprehensive scheme for fisheries sector development with focus on modernization, infrastructure, and fishermen welfare.", "eligibility_occupation": "fisherman", "benefit_type": "Subsidy", "benefit_amount": "Up to 60% subsidy on project cost", "loan_amount": "Up to ₹20 lakh", "deadline": "2027-03-31", "is_active": True},
            {"scheme_name": "Tamil Nadu Chief Minister's Fishermen Insurance Scheme", "authority": "Tamil Nadu Fisheries Department", "description": "Life insurance coverage for registered fishermen and their families.", "eligibility_occupation": "fisherman", "benefit_type": "Insurance", "benefit_amount": "₹5 lakh life insurance, ₹2 lakh accident cover", "is_active": True},
            {"scheme_name": "National Rural Livelihood Mission (DAY-NRLM)", "authority": "Ministry of Rural Development", "description": "Promotes self-employment and self-help groups among rural women including coastal communities.", "eligibility_occupation": "woman", "benefit_type": "Grant", "benefit_amount": "₹10,000-₹25,000 seed capital per SHG member", "is_active": True},
            {"scheme_name": "Mudra Loan for Fishermen", "authority": "Pradhan Mantri Mudra Yojana", "description": "Collateral-free loans up to ₹10 lakh for fishery and aquaculture activities.", "eligibility_occupation": "fisherman", "benefit_type": "Loan", "benefit_amount": "Up to ₹10 lakh collateral-free", "is_active": True},
            {"scheme_name": "Tamil Nadu SC/ST Loan Waiver Scheme", "authority": "Tamil Nadu Adi Dravida Welfare Department", "description": "Education loan waiver for SC/ST students from fishing communities.", "eligibility_occupation": "sc_st", "benefit_type": "Loan Waiver", "benefit_amount": "Full waiver of education loans up to ₹5 lakh", "is_active": True},
        ]

        for data in schemes_data:
            if "deadline" in data and data["deadline"]:
                data["deadline"] = datetime.strptime(data["deadline"], "%Y-%m-%d").date()
            GovernmentScheme.objects.create(**data)
        self.stdout.write(f"  Created {len(schemes_data)} government schemes")

        workshops_data = [
            {"title": "Seaweed Farming Workshop", "description": "Hands-on training on seaweed cultivation techniques, harvesting, and market linkage.", "date": datetime.now() + timedelta(days=15), "duration_hours": 6, "max_participants": 25, "fee": Decimal("500"), "skills_taught": "Seaweed seedling preparation, rope farming, harvesting, drying techniques", "is_free": False},
            {"title": "Eco-Tourism Guide Certification", "description": "Certification program for fishermen to become licensed eco-tourism guides.", "date": datetime.now() + timedelta(days=22), "duration_hours": 16, "max_participants": 20, "fee": Decimal("0"), "skills_taught": "Tourist safety, local ecology, first aid, English communication, marine wildlife identification", "is_free": True},
            {"title": "Fish Value Addition & Food Safety", "description": "Training on fish processing, preservation, packaging, and FSSAI compliance.", "date": datetime.now() + timedelta(days=30), "duration_hours": 8, "max_participants": 30, "fee": Decimal("1000"), "skills_taught": "Fish drying, smoking, pickling, packaging standards, FSSAI basics", "is_free": False},
            {"title": "Digital Marketing for Fishermen", "description": "Teach fishermen to sell fish and fish products online using social media and e-commerce.", "date": datetime.now() + timedelta(days=35), "duration_hours": 4, "max_participants": 40, "fee": Decimal("0"), "skills_taught": "WhatsApp Business, Instagram marketing, online payment systems, basic photography", "is_free": True},
        ]

        for data in workshops_data:
            Workshop.objects.create(**data)
        self.stdout.write(f"  Created {len(workshops_data)} workshops")

    def _create_notifications(self):
        from notifications.models import Notification
        self._create_users()

        if Notification.objects.exists():
            self.stdout.write("Notifications already exist, skipping.")
            return

        notif_data = [
            {"username": "arumugam", "notification_type": "contribution_verified", "title": "Contribution Verified!", "message": "Your ocean sound recording from Nagapattinam has been verified. 20 points awarded!", "is_read": True},
            {"username": "lakshmi", "notification_type": "recognition_received", "title": "Community Champion Award", "message": "Congratulations! You have been awarded the Community Champion title for 2026.", "is_read": True},
            {"username": "kumar", "notification_type": "event_nearby", "title": "Upcoming: Beach Cleanup at Poompuhar", "message": "A beach cleanup event is happening in 5 days near your village. Join us!", "is_read": False},
            {"username": "priya", "notification_type": "contribution_verified", "title": "Education Post Verified", "message": "Your blog post about Ocean Conservation has been verified and published.", "is_read": False},
            {"username": "meena", "notification_type": "sighting_validated", "title": "Sighting Validated", "message": "Your marine sighting report has been validated by our scientific team.", "is_read": False},
            {"username": "arumugam", "notification_type": "scheme_updated", "title": "Fishermen Insurance Scheme Updated", "message": "The government has updated the fishermen insurance scheme. Check the new benefits.", "is_read": False},
        ]
        for n in notif_data:
            user = self._get_user(n.pop("username"))
            if user:
                Notification.objects.create(user=user, **n)
        self.stdout.write("  Created 6 notifications")
