"""Seed ecotourism sample data for Tamil Nadu coastal region."""
import os
import sys
import django

_base = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
if _base not in sys.path:
    sys.path.insert(0, _base)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'o3l.settings.development')
django.setup()

from ecotourism.models import BeachProfile, TourismOpportunity, BeachCleanupEvent, LocalBusiness
from locations.models import Village

villages = list(Village.objects.all())
if not villages:
    print("No villages found. Run location seed first.")
    sys.exit(1)

v = {v.name: v for v in villages}

def get_village(name):
    for key in v:
        if name.lower() in key.lower():
            return v[key]
    return villages[0]

beaches_data = [
    {
        "name": "Marina Beach",
        "slug": "marina-beach",
        "description": "One of the longest natural urban beaches in the world, stretching 13 km along the Bay of Bengal. A popular gathering spot for morning walks, street food, and kite flying.",
        "village_name": "Mahabalipuram",
        "cleanliness": "good",
        "safety": "safe",
        "has_toilets": True,
        "has_parking": True,
        "has_food_stalls": True,
        "has_lifeguard": True,
        "has_first_aid": True,
        "has_seating": True,
        "latitude": 13.0500,
        "longitude": 80.2824,
        "average_rating": 4.2,
        "total_reviews": 348,
    },
    {
        "name": "Elliot's Beach",
        "slug": "elliot-beach",
        "description": "A serene and less crowded beach in Besant Nagar. Known for the Schmidt Memorial and the Ashtalakshmi Temple nearby. Ideal for evening strolls.",
        "village_name": "Besant Nagar",
        "cleanliness": "excellent",
        "safety": "very_safe",
        "has_toilets": True,
        "has_parking": True,
        "has_food_stalls": True,
        "has_lifeguard": True,
        "has_first_aid": True,
        "has_seating": True,
        "latitude": 12.9988,
        "longitude": 80.2676,
        "average_rating": 4.5,
        "total_reviews": 215,
    },
    {
        "name": "Mahabalipuram Beach",
        "slug": "mahabalipuram-beach",
        "description": "A UNESCO World Heritage coastal town with ancient rock-cut temples and shore temple. Famous for stone carving artisans and surfing.",
        "village_name": "Mahabalipuram",
        "cleanliness": "good",
        "safety": "moderate",
        "has_toilets": True,
        "has_parking": True,
        "has_food_stalls": True,
        "has_lifeguard": False,
        "has_first_aid": True,
        "has_seating": False,
        "latitude": 12.6166,
        "longitude": 80.1992,
        "average_rating": 4.3,
        "total_reviews": 412,
    },
    {
        "name": "Covelong Beach",
        "slug": "covelong-beach",
        "description": "A quiet fishing village turned surf paradise. Home to the Covelong Point Surfing Festival and a thriving eco-tourism community.",
        "village_name": "Ennore",
        "cleanliness": "excellent",
        "safety": "safe",
        "has_toilets": True,
        "has_parking": True,
        "has_food_stalls": False,
        "has_lifeguard": True,
        "has_first_aid": True,
        "has_seating": True,
        "latitude": 12.4853,
        "longitude": 80.2526,
        "average_rating": 4.6,
        "total_reviews": 178,
    },
    {
        "name": "Kovalam Beach (Tamil Nadu)",
        "slug": "kovalam-tn-beach",
        "description": "A crescent-shaped beach near Chennai with calm waters. Popular for kayaking and stand-up paddleboarding. Home to several beach resorts.",
        "village_name": "Besant Nagar",
        "cleanliness": "good",
        "safety": "safe",
        "has_toilets": True,
        "has_parking": True,
        "has_food_stalls": True,
        "has_lifeguard": True,
        "has_first_aid": False,
        "has_seating": False,
        "latitude": 12.5950,
        "longitude": 80.2430,
        "average_rating": 4.0,
        "total_reviews": 156,
    },
    {
        "name": "Pondicherry Promenade Beach",
        "slug": "pondicherry-promenade-beach",
        "description": "A 1.5 km rocky promenade along the Bay of Bengal, lined with French colonial buildings. Known for its sunrises and heritage walks.",
        "village_name": "Nagapattinam",
        "cleanliness": "excellent",
        "safety": "very_safe",
        "has_toilets": True,
        "has_parking": True,
        "has_food_stalls": True,
        "has_lifeguard": True,
        "has_first_aid": True,
        "has_seating": True,
        "latitude": 11.9320,
        "longitude": 79.8350,
        "average_rating": 4.7,
        "total_reviews": 523,
    },
]

beaches = []
for bd in beaches_data:
    vil_name = bd.pop("village_name")
    vil = get_village(vil_name)
    b, _ = BeachProfile.objects.update_or_create(
        slug=bd["slug"],
        defaults={**bd, "village": vil, "is_active": True}
    )
    beaches.append(b)
    print(f"Beach: {b.name}")

opportunities_data = [
    {
        "name": "Whale Watching from Mahabalipuram",
        "opportunity_type": "whale_watching",
        "description": "Spot blue whales and sperm whales off the Coromandel Coast between November and March. Expert marine biologists guide the boat trips.",
        "beach": beaches[2],
        "price_range": "₹1500-2500/person",
        "duration": "4-6 hours",
        "max_participants": 20,
        "is_sustainable": True,
        "rating": 4.8,
        "latitude": 12.6200,
        "longitude": 80.2100,
    },
    {
        "name": "Snorkeling at Covelong Reef",
        "opportunity_type": "snorkeling",
        "description": "Explore the vibrant coral reefs near Covelong Point. Equipment provided. Best visibility from October to January.",
        "beach": beaches[3],
        "price_range": "₹800-1200/person",
        "duration": "2-3 hours",
        "max_participants": 12,
        "is_sustainable": True,
        "rating": 4.5,
        "latitude": 12.4880,
        "longitude": 80.2540,
    },
    {
        "name": "Sunrise Boat Tour — Pulicat Lake",
        "opportunity_type": "boat_tour",
        "description": "Early morning boat ride through the Pulicat Lake bird sanctuary. Spot flamingos, pelicans, and painted storks during migratory season.",
        "beach": beaches[0],
        "price_range": "₹600-900/person",
        "duration": "3 hours",
        "max_participants": 15,
        "is_sustainable": True,
        "rating": 4.6,
        "latitude": 13.4500,
        "longitude": 80.2000,
    },
    {
        "name": "Heritage Walking Tour — Pondicherry",
        "opportunity_type": "cultural_tour",
        "description": "Walk through the French Quarter, visit Auroville, and explore the Sri Aurobindo Ashram. Learn about colonial history and spiritual heritage.",
        "beach": beaches[5],
        "price_range": "₹500-800/person",
        "duration": "3-4 hours",
        "max_participants": 25,
        "is_sustainable": False,
        "rating": 4.4,
        "latitude": 11.9340,
        "longitude": 79.8300,
    },
    {
        "name": "Mangrove Kayaking — Muttukadu",
        "opportunity_type": "boat_tour",
        "description": "Paddle through the Muttukadu mangrove ecosystem. Learn about coastal ecology and spot kingfishers, egrets, and otters.",
        "beach": beaches[4],
        "price_range": "₹1000-1500/person",
        "duration": "2.5 hours",
        "max_participants": 10,
        "is_sustainable": True,
        "rating": 4.7,
        "latitude": 12.5100,
        "longitude": 80.1800,
    },
    {
        "name": "Traditional Fishing Experience",
        "opportunity_type": "fishing_trip",
        "description": "Join local fishermen for a day at sea. Learn traditional net casting, line fishing, and cook your catch on the beach.",
        "beach": beaches[3],
        "price_range": "₹700-1000/person",
        "duration": "5-7 hours",
        "max_participants": 8,
        "is_sustainable": True,
        "rating": 4.3,
        "latitude": 12.4860,
        "longitude": 80.2530,
    },
]

for od in opportunities_data:
    o, _ = TourismOpportunity.objects.update_or_create(
        name=od["name"],
        defaults={**od, "is_active": True}
    )
    print(f"Opportunity: {o.name}")

cleanups_data = [
    {
        "beach": beaches[0],
        "title": "Marina Beach Sunday Cleanup",
        "description": "Weekly community cleanup drive at Marina Beach. Plastic bottles, wrappers, and fishing nets collected. Volunteers get free breakfast.",
        "cleanup_date": "2026-09-07",
        "participants_count": 45,
        "waste_collected_kg": 120.5,
    },
    {
        "beach": beaches[1],
        "title": "Elliot's Beach Monsoon Cleanup",
        "description": "Special monsoon cleanup to clear driftwood, plastic debris, and seaweed from the shoreline. Partners with local schools.",
        "cleanup_date": "2026-10-15",
        "participants_count": 32,
        "waste_collected_kg": 85.0,
    },
    {
        "beach": beaches[2],
        "title": "Mahabalipuram Shore Temple Cleanup",
        "description": "Heritage beach cleanup near the Shore Temple. Focused on microplastics and cigarette butts. Organized by local fishing cooperative.",
        "cleanup_date": "2026-09-20",
        "participants_count": 28,
        "waste_collected_kg": 62.0,
    },
    {
        "beach": beaches[5],
        "title": "Pondicherry Promenade Monthly Drive",
        "description": "Monthly cleanup along the Promenade Beach. Includes waste segregation awareness session for tourists.",
        "cleanup_date": "2026-11-01",
        "participants_count": 55,
        "waste_collected_kg": 98.0,
    },
]

for cd in cleanups_data:
    c, _ = BeachCleanupEvent.objects.update_or_create(
        title=cd["title"],
        defaults=cd
    )
    print(f"Cleanup: {c.title}")

businesses_data = [
    {
        "name": "The Fisherman's Table",
        "category": "restaurant",
        "description": "Seaside restaurant serving fresh catch of the day, traditional Tamil seafood curry, and grilled prawns. Family-run since 1985.",
        "village_name": "Mahabalipuram",
        "is_sustainable": True,
        "rating": 4.5,
        "latitude": 12.6170,
        "longitude": 80.1980,
    },
    {
        "name": "Covelong Surf & Stay",
        "category": "homestay",
        "description": "Eco-friendly surf camp with bamboo cottages, surf lessons, and organic meals. Carbon-neutral operation powered by solar energy.",
        "village_name": "Ennore",
        "is_sustainable": True,
        "rating": 4.8,
        "latitude": 12.4860,
        "longitude": 80.2520,
    },
    {
        "name": "Kadal Osai Crafts",
        "category": "craft",
        "description": "Artisan cooperative selling hand-carved stone sculptures, shell jewelry, and traditional fishing nets. All proceeds support local fishermen families.",
        "village_name": "Mahabalipuram",
        "is_sustainable": True,
        "rating": 4.3,
        "latitude": 12.6155,
        "longitude": 80.1995,
    },
    {
        "name": "Pondy Eco Tours",
        "category": "guide",
        "description": "Certified eco-tourism guide service offering heritage walks, cycling tours, and backwater trips. Bilingual guides in English, Tamil, and French.",
        "village_name": "Nagapattinam",
        "is_sustainable": True,
        "rating": 4.6,
        "latitude": 11.9330,
        "longitude": 79.8340,
    },
    {
        "name": "Muttukadu Boat House",
        "category": "transport",
        "description": "Government-run boat house offering speed boats, rowboats, and kayaking in the backwaters. Affordable family packages available.",
        "village_name": "Ennore",
        "is_sustainable": False,
        "rating": 3.9,
        "latitude": 12.5090,
        "longitude": 80.1810,
    },
    {
        "name": "Marina Morning Chai Stall",
        "category": "restaurant",
        "description": "Iconic beach-side chai stall serving filter coffee and vadai since 1970. Open 5 AM to 9 AM. A must-visit for sunrise watchers.",
        "village_name": "Mahabalipuram",
        "is_sustainable": False,
        "rating": 4.1,
        "latitude": 13.0510,
        "longitude": 80.2830,
    },
]

for bd in businesses_data:
    vil_name = bd.pop("village_name")
    vil = get_village(vil_name)
    b, _ = LocalBusiness.objects.update_or_create(
        name=bd["name"],
        defaults={**bd, "village": vil, "is_active": True}
    )
    print(f"Business: {b.name}")

print("\nDone! Sample ecotourism data seeded.")
