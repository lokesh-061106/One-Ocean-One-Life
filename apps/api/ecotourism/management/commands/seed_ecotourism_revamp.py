"""
Seed the O3L ecotourism revamp: split rules, fisher families, 5-model
experiences, packages and sample reviews. Idempotent (upsert by slug/name).

Usage: python manage.py seed_ecotourism_revamp
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db.models import Avg

from ecotourism.models import (
    ExperiencePackage,
    FisherFamily,
    Review,
    SplitRule,
    TourismOpportunity,
)
from locations.models import Village


def village(name, district):
    return Village.objects.filter(name=name, district__name=district).first()


def fdec(v):
    return Decimal(str(v))


SPLIT_RULES = [
    dict(
        name='O3L standard split',
        scope='default',
        provider_pct=80, village_pct=10, platform_pct=5, conservation_pct=5,
        is_default=True, is_active=True,
    ),
    dict(
        name='O3L package split',
        scope='package',
        provider_pct=80, village_pct=10, platform_pct=5, conservation_pct=5,
        is_default=False, is_active=True,
    ),
]

FAMILIES = [
    dict(name='Paaravaar Ennore Family', v=('Ennore', 'Chennai'), members=6,
         skills=['boat guiding', 'net making', 'fish identification'],
         description='Third-generation Ennore fishing family running sunrise boat trips and net-making demos for visitors.'),
    dict(name='Besant Nagar Kadal Family', v=('Besant Nagar', 'Chennai'), members=5,
         skills=['storytelling', 'cooking', 'marine education'],
         description='A Besant Nagar family hosting seafood meals, coastal walks and ocean-sound sessions.'),
    dict(name='Neendakara Dasa Kudumbam', v=('Neendakara', 'Kollam'), members=8,
         skills=['homestay', 'traditional fishing', 'seafood cooking'],
         description='Neendakara family offering homestays, fishing demos and the flagship 2-day village experience.'),
    dict(name='Vypin Tharavadu Family', v=('Vypin', 'Ernakulam'), members=7,
         skills=['homestay', 'mangrove guiding', 'coconut cookery'],
         description='Vypin household beside the mangroves — homestay rooms, kayaking support and backwater birding.'),
    dict(name='Malpe Sagara Family', v=('Malpe', 'Udupi'), members=6,
         skills=['boat handling', 'citizen science', 'beach guiding'],
         description='Malpe family hosting beach biodiversity walks and citizen-science surveys with schools.'),
    dict(name='Karwar Sagardeepa Family', v=('Karwar', 'Uttara Kannada'), members=5,
         skills=['dolphin watching', 'boat guiding', 'fish identification'],
         description='Karwar family running dolphin-spotting boat rides and coastal bird observation.'),
    dict(name='Kakinada Matsya Family', v=('Kakinada', 'Kakinada'), members=9,
         skills=['traditional fishing demo', 'village walks', 'net making'],
         description='Kakinada family demonstrating traditional gear and leading fishing-village heritage walks.'),
    dict(name='Alanthalai Kadal Family', v=('Alanthalai', 'Thoothukudi'), members=7,
         skills=['festival organising', 'craft making', 'turtle awareness'],
         description='Alanthalai family behind the Saturday village festival, craft stalls and turtle-safe beach walks.'),
]

# (name, type, category, village tuple, price_min, price_max, unit, duration,
#  duration_minutes, offshore, highlights, inclusions)
EXPERIENCES = [
    # ---------------- Model 1: Fisher-led Coastal Experience ----------------
    dict(name='Sunrise Traditional Boat Experience', otype='boat_tour', cat='fisher_coastal',
         v=('Ennore', 'Chennai'), pmin=2000, pmax=4000, unit='boat',
         duration='1–2 hours', duration_minutes=120, offshore=True, maxp=8,
         meeting='Ennore fishing harbour jetty', sustainable=True, lat=13.2164, lng=80.3247,
         highlights=['Traditional fishing boat', 'Boat handling & net preparation',
                     'Sunrise on the water', 'Local sea stories'],
         inclusions=['Fisher guide', 'Life jackets', 'Welcome drink'],
         description='Set out at dawn with a fisher from Ennore as your guide — not a boat operator, but a storyteller. See how nets are prepared, learn boat handling and traditional navigation, and watch the coast wake up. A 1–3 hour experience run by the family itself.'),
    dict(name='Small-Group Traditional Fishing Experience', otype='fishing_trip', cat='fisher_coastal',
         v=('Neendakara', 'Kollam'), pmin=2500, pmax=5000, unit='group',
         duration='3 hours', duration_minutes=180, offshore=True, maxp=6,
         meeting='Neendakara fishing harbour', sustainable=True, lat=8.94, lng=76.53,
         highlights=['Join the crew for a short haul', 'Responsible catch-and-release',
                     'Fish identification on deck'],
         inclusions=['Guide fisher', 'Gear', 'Fresh catch sharing'],
         description='A small-group morning with the Neendakara crew: help set the net, identify the catch, and learn responsible catch-and-release recreational fishing. One tourist, several households — the guide, the gear owner and the family cooks all share.'),
    dict(name='Fisher Culture: Nets, Boats & Sea Stories', otype='cultural_tour', cat='fisher_coastal',
         v=('Besant Nagar', 'Chennai'), pmin=1000, pmax=2000, unit='group',
         duration='90 minutes', duration_minutes=90, offshore=False, maxp=12,
         meeting='Besant Nagar fishing hamlet entrance', sustainable=True, lat=13.0067, lng=80.2669,
         highlights=['Net-making demonstration', 'Traditional navigation knowledge',
                     'Sea legends of the coast'],
         inclusions=['Fisher storyteller', 'Tea'],
         description='Sit with an elder of the Besant Nagar hamlet as he demonstrates net-making, explains traditional navigation by stars and current, and shares the local stories of the sea. The fisherman becomes the guide and storyteller.'),
    dict(name='Sunset Trip along the Blue Coast', otype='sunset_trip', cat='fisher_coastal',
         v=('Rushikonda', 'Visakhapatnam'), pmin=1500, pmax=3000, unit='boat',
         duration='90 minutes', duration_minutes=90, offshore=True, maxp=10,
         meeting='Rushikonda boat point', sustainable=True, lat=17.78, lng=83.385,
         highlights=['Golden-hour boat ride', 'Coastal bird observation'],
         inclusions=['Boat & crew', 'Life jackets'],
         description='A golden-hour boat ride off Rushikonda with a local crew, combining sunset views with coastal bird observation along the way.'),
    dict(name='Traditional Fishing Demonstration', otype='traditional_fishing_demo', cat='fisher_coastal',
         v=('Kakinada', 'Kakinada'), pmin=500, pmax=1500, unit='person',
         duration='60 minutes', duration_minutes=60, offshore=False, maxp=25,
         meeting='Kakinada fish landing centre', sustainable=True, lat=16.98, lng=82.28,
         highlights=['Traditional gear in action', 'Fish identification table'],
         inclusions=['Demonstration', 'Printed fish ID card'],
         description='Watch the Kakinada family demonstrate traditional gear step by step, then try identifying the catch of the day at the ID table. A compact, high-value experience that runs in any weather.'),

    # ------------- Model 2: Mangrove, Lagoon & Marine Nature Tours -------------
    dict(name='Mangrove Kayaking through the Creeks', otype='kayak_tour', cat='nature_tours',
         v=('Vypin', 'Ernakulam'), pmin=1500, pmax=3000, unit='person',
         duration='2 hours', duration_minutes=120, offshore=False, maxp=8,
         meeting='Vypin mangrove jetty', sustainable=True, lat=10.03, lng=76.23,
         highlights=['Paddle silent mangrove creeks', 'Crab & bird spotting',
                     'Coastal vegetation interpretation'],
         inclusions=['Kayak & paddle', 'Life jacket', 'Nature guide'],
         description='Paddle the quiet mangrove creeks near Vypin with a village guide who knows every root and bird call. Tourism that conserves natural areas while sustaining local well-being.'),
    dict(name='Backwater Bird Watching Walk', otype='bird_watching', cat='nature_tours',
         v=('Arthunkal', 'Alappuzha'), pmin=1000, pmax=2000, unit='person',
         duration='2 hours', duration_minutes=120, offshore=False, maxp=12,
         meeting='Arthunkal beach road', sustainable=True, lat=9.7, lng=76.43,
         highlights=['Egrets, terns & sea eagles', 'Estuary viewpoints'],
         inclusions=['Optics', 'Young guide', 'Field notes booklet'],
         description='A slow walk with a young village guide along the Arthunkal estuary, reading the tide and the birds — painted storks, terns and sea eagles.'),
    dict(name='Estuary & Coastal Nature Walk', otype='nature_walk', cat='nature_tours',
         v=('Mogalthur', 'West Godavari'), pmin=500, pmax=1000, unit='person',
         duration='90 minutes', duration_minutes=90, offshore=False, maxp=20,
         meeting='Mogalthur estuary bridge', sustainable=True, lat=16.416, lng=81.68,
         highlights=['Mouth of the river', 'Mudskipper spotting'],
         inclusions=['Local guide'],
         description='Explore where the river meets the sea at Mogalthur — mudskippers, fiddler crabs and the working boats of the estuary.'),
    dict(name='Turtle-Safe Beach Biodiversity Walk', otype='turtle_watching', cat='nature_tours',
         v=('Alanthalai', 'Thoothukudi'), pmin=1000, pmax=2000, unit='person',
         duration='2 hours', duration_minutes=120, offshore=False, maxp=15,
         meeting='Alanthalai beach', sustainable=True, lat=8.4297, lng=78.076,
         highlights=['Observe from appropriate distances', 'Nest awareness with local volunteers'],
         inclusions=['Guide', 'Red-filter torch for night runs'],
         description='Turtle observation done responsibly — from appropriate distances, with village volunteers explaining nesting seasons and how lights are managed.'),
    dict(name='Dolphin Spotting Boat Ride', otype='dolphin_watching', cat='nature_tours',
         v=('Karwar', 'Uttara Kannada'), pmin=1500, pmax=3000, unit='person',
         duration='2 hours', duration_minutes=120, offshore=True, maxp=10,
         meeting='Karwar harbour', sustainable=True, lat=14.812, lng=74.12,
         highlights=['Irrawaddy & humpback dolphins', 'Island views'],
         inclusions=['Boat & crew', 'Life jackets'],
         description='Head out from Karwar with a family crew to look for dolphins where the estuary meets the sea — sightings where appropriate, never chased.'),
    dict(name='Marine Conservation Beach Walk', otype='nature_walk', cat='nature_tours',
         v=('Malpe', 'Udupi'), pmin=500, pmax=1000, unit='person',
         duration='90 minutes', duration_minutes=90, offshore=False, maxp=20,
         meeting='Malpe beach clean-up point', sustainable=True, lat=13.351, lng=74.698,
         highlights=['Waste segregation on the go', 'Microplastic demo'],
         inclusions=['Gloves & bag', 'Guide'],
         description='A conservation walk that doubles as a beach clean-up, with a short demo on microplastics found along the Malpe shore.'),
    dict(name='Coastal Photography Morning', otype='coastal_photography', cat='nature_tours',
         v=('Suryalanka', 'Bapatla'), pmin=1000, pmax=3000, unit='person',
         duration='3 hours', duration_minutes=180, offshore=False, maxp=10,
         meeting='Suryalanka beach gate', sustainable=True, lat=15.8487, lng=80.5338,
         highlights=['Golden-hour framing', 'Boats as subjects'],
         inclusions=['Photo walk', 'Editing tips sheet'],
         description='A guided photo walk along Suryalanka — boats, nets and reflections, coached by a village photographer.'),

    # --------------- Model 3: Fisher Village Homestay & Local Food ---------------
    dict(name='Fisher Village Homestay (per night)', otype='homestay_stay', cat='homestay_food',
         v=('Neendakara', 'Kollam'), pmin=1500, pmax=3500, unit='night',
         duration='1 night', duration_minutes=1440, offshore=False, maxp=4,
         meeting='Neendakara family home', sustainable=True, lat=8.94, lng=76.53,
         highlights=['One clean guest room', 'Local breakfast', 'Village walk included'],
         inclusions=['Breakfast', 'Evening tea', 'Village walk'],
         description='One clean guest room in the Neendakara family home, with local breakfast and the rhythm of the fishing village as your alarm.'),
    dict(name='Traditional Seafood Meal with a Fisher Family', otype='seafood_meal', cat='homestay_food',
         v=('Vypin', 'Ernakulam'), pmin=200, pmax=500, unit='person',
         duration='60 minutes', duration_minutes=60, offshore=False, maxp=12,
         meeting='Vypin family kitchen', sustainable=True, lat=10.03, lng=76.23,
         highlights=['Catch-of-the-day', 'Coconut-based coastal recipes'],
         inclusions=['Full meal', 'Recipe card to take home'],
         description='A simple, generous seafood lunch cooked by the family from the morning catch — the fisherwoman as host, not the hotel kitchen.'),
    dict(name='Coastal Cooking Experience', otype='cooking_experience', cat='homestay_food',
         v=('Besant Nagar', 'Chennai'), pmin=500, pmax=1000, unit='person',
         duration='2 hours', duration_minutes=120, offshore=False, maxp=8,
         meeting='Besant Nagar Kadal Family home', sustainable=True, lat=13.0067, lng=80.2669,
         highlights=['Fish cleaning basics', 'Masala grinding by hand'],
         inclusions=['Ingredients', 'Lunch you cooked', 'Recipe sheet'],
         description='Cook alongside the family: prep the fish, grind the masala, and sit down to what you made.'),
    dict(name='Net-Making Demonstration', otype='net_making_demo', cat='homestay_food',
         v=('Ennore', 'Chennai'), pmin=300, pmax=800, unit='person',
         duration='45 minutes', duration_minutes=45, offshore=False, maxp=15,
         meeting='Ennore net yard', sustainable=True, lat=13.2164, lng=80.3247,
         highlights=['Mending a net yourself', 'Float & weight logic'],
         inclusions=['Guide', 'Hands-on practice net'],
         description='The net maker shows how a net is born and mended — then puts the needle in your hands.'),
    dict(name='Boat-Building & Repair Demonstration', otype='boat_building_demo', cat='homestay_food',
         v=('Chinnamuttom', 'Kanyakumari'), pmin=500, pmax=1500, unit='person',
         duration='90 minutes', duration_minutes=90, offshore=False, maxp=12,
         meeting='Chinnamuttom boat yard', sustainable=True, lat=8.0977, lng=77.5663,
         highlights=['Wooden hull craft', 'Fibreglass repair basics'],
         inclusions=['Demonstration', 'Boatyard tour'],
         description='Watch (and ask about) the craft of building and repairing country boats at the Chinnamuttom yard.'),
    dict(name='Fishing Village Heritage Walk', otype='village_walk', cat='homestay_food',
         v=('Kakinada', 'Kakinada'), pmin=500, pmax=1500, unit='person',
         duration='90 minutes', duration_minutes=90, offshore=False, maxp=15,
         meeting='Kakinada harbour gate', sustainable=True, lat=16.98, lng=82.28,
         highlights=['Harbour to hearth', 'Shrine & boat-yard stops'],
         inclusions=['Local guide'],
         description='From the harbour to the kitchen: the working geography of a fishing village, explained by the people who live it.'),

    # ---------------- Model 4: Ocean Learning & Blue Experiences ----------------
    dict(name='Listen to the Ocean — Underwater Sound Demo', otype='underwater_sounds', cat='ocean_learning',
         v=('Besant Nagar', 'Chennai'), pmin=1000, pmax=2000, unit='group',
         duration='75 minutes', duration_minutes=75, offshore=False, maxp=20,
         meeting='O3L coastal classroom, Besant Nagar', sustainable=True, lat=13.0067, lng=80.2669,
         highlights=['Dolphin clicks & whale sounds', 'Shrimp snaps', 'Boat noise vs. nature'],
         inclusions=['Headphones', 'Sound guide booklet'],
         description='Put on headphones and hear the ocean: dolphin clicks, whale calls, shrimp snaps, waves and harbour noise — then O3L explains what you are hearing. Marine bioacoustics made tangible.'),
    dict(name='School Ocean-Learning Program', otype='school_program', cat='ocean_learning',
         v=('Ennore', 'Chennai'), pmin=300, pmax=800, unit='student',
         duration='4 hours', duration_minutes=240, offshore=False, maxp=60,
         meeting='O3L learning centre, Ennore', sustainable=True, lat=13.2164, lng=80.3247,
         highlights=['Fish identification', 'Coral & mangrove modules', 'Sound lab'],
         inclusions=['Workbook', 'Lunch', 'Certificate'],
         description='A structured program for school students covering marine mammals, fish, coral, mangroves and ocean noise — creating work for educated children of fishing families as assistants.'),
    dict(name='Marine Life Identification Experience', otype='marine_education', cat='ocean_learning',
         v=('Vizhinjam', 'Thiruvananthapuram'), pmin=1000, pmax=2500, unit='person',
         duration='3 hours', duration_minutes=180, offshore=False, maxp=12,
         meeting='Vizhinjam rock shore', sustainable=True, lat=8.3833, lng=76.9833,
         highlights=['Intertidal biodiversity', 'Species ID sheets'],
         inclusions=['Field guide', 'Tray & lens'],
         description='Turn over nothing, look under everything: a guided intertidal survey with species identification at Vizhinjam.'),
    dict(name='Citizen Science Beach Survey', otype='citizen_science', cat='ocean_learning',
         v=('Malpe', 'Udupi'), pmin=500, pmax=1000, unit='person',
         duration='2 hours', duration_minutes=120, offshore=False, maxp=20,
         meeting='Malpe survey start marker', sustainable=True, lat=13.351, lng=74.698,
         highlights=['Real data to the O3L dataset', 'Waste & wildlife transect'],
         inclusions=['Data sheets', 'Gloves'],
         description='Run a real survey transect — your observations feed the O3L citizen-science dataset while you learn field method.'),

    # ---------- Model 5: Weekend Coastal Community Festival & Marketplace ----------
    dict(name='Saturday — Life of the Fishing Village', otype='festival', cat='festival_market',
         v=('Alanthalai', 'Thoothukudi'), pmin=300, pmax=300, unit='person',
         duration='Full day', duration_minutes=780, offshore=False, maxp=300,
         meeting='Alanthalai village green', sustainable=True, lat=8.4297, lng=78.076,
         weekday='saturday', start_time='06:00', end_time='19:00',
         highlights=['Morning fishing demo & boat rides', 'Fish identification',
                     'Fisherwomen\'s food stalls', 'Crafts & local products',
                     'Traditional music & sea stories', 'Sunset & beach clean-up'],
         inclusions=['Entry pass', 'Activity tokens'],
         description='The weekly event that involves the whole village: morning fishing demonstrations and boat experiences, afternoon seafood and crafts, evening music, stories and a beach clean-up. Entry passes, food stalls, workshops and sponsorship all generate income.'),
    dict(name="Fishermen's Craft & Food Market", otype='craft_market', cat='festival_market',
         v=('Ennore', 'Chennai'), pmin=100, pmax=1000, unit='person',
         duration='5 hours', duration_minutes=300, offshore=False, maxp=200,
         meeting='Ennore harbour market street', sustainable=True, lat=13.2164, lng=80.3247,
         weekday='saturday', start_time='09:00', end_time='14:00',
         highlights=['Fisherwomen\'s products', 'Local crafts', 'Fresh catch stall'],
         inclusions=['Entry'],
         description='A weekend marketplace of handicrafts, pickles, dried fish and coastal food run directly by the fisherwomen\'s groups.'),
    dict(name='Sea Stories & Traditional Music Evening', otype='cultural_performance', cat='festival_market',
         v=('Arthunkal', 'Alappuzha'), pmin=500, pmax=1500, unit='person',
         duration='3 hours', duration_minutes=180, offshore=False, maxp=80,
         meeting='Arthunkal beach amphitheatre', sustainable=True, lat=9.7, lng=76.43,
         weekday='sunday', start_time='17:00', end_time='20:00',
         highlights=['Elders\' sea stories', 'Folk music', 'Sunset viewing'],
         inclusions=['Seating', 'Filter coffee'],
         description='An evening of traditional music and sea stories told by the elders, ending with the sunset over the backwaters.'),
]

PACKAGES = [
    dict(
        title='2 Days — Experience a Real Fishing Village',
        slug='2-days-real-fishing-village',
        cat='homestay_food', v=('Ennore', 'Chennai'), price=4999, original=6500,
        duration='2 days', duration_minutes=2880, maxp=12,
        description=(
            'The flagship O3L package: six families, one village, one price. '
            'Instead of a hotel and a boat operator, your payment is automatically '
            'divided among the participating households — homestay family, boat family, '
            'cook, guide, net-maker and cultural host.'
        ),
        inclusions=['Homestay night', 'Breakfast', 'Fishing-village walk',
                    'Boat experience', 'Seafood lunch', 'Traditional fishing demonstration',
                    'Sunset experience'],
        itinerary=[
            {'time': '15:00', 'title': 'Arrive & village walk', 'detail': 'Meet your host family and walk the hamlet.'},
            {'time': '17:00', 'title': 'Sunset boat experience', 'detail': 'Out with the boat family as the day cools.'},
            {'time': '19:00', 'title': 'Seafood dinner', 'detail': 'Cooked by the fishing family from the day’s catch.'},
            {'time': '06:00', 'title': 'Sunrise on the water', 'detail': 'Optional second boat run at dawn.'},
            {'time': '09:00', 'title': 'Breakfast + net-making demo', 'detail': 'With the village net maker.'},
            {'time': '11:00', 'title': 'Fishing demonstration & fish ID', 'detail': 'Gear, technique and identification.'},
            {'time': '13:00', 'title': 'Seafood farewell lunch', 'detail': 'Before you leave, the split is shown in-app.'},
        ],
        lat=13.2164, lng=80.3247,
        families=['Paaravaar Ennore Family', 'Besant Nagar Kadal Family'],
    ),
    dict(
        title='Blue Weekend — Nature, Sounds & Stories',
        slug='blue-weekend-nature-sounds-stories',
        cat='ocean_learning', v=('Vypin', 'Ernakulam'), price=2999, original=3900,
        duration='2 days', duration_minutes=1440, maxp=16,
        description=(
            'A weekend of mangrove kayaking, birding and the O3L underwater-sound '
            'session — designed for families and school groups who want the ocean '
            'with the science switched on.'
        ),
        inclusions=['Mangrove kayaking', 'Bird watching walk',
                    'Underwater sound demonstration', 'Village lunch', 'Field notes booklet'],
        itinerary=[
            {'time': '08:00', 'title': 'Mangrove kayaking', 'detail': 'Paddle the Vypin creeks with a village guide.'},
            {'time': '11:00', 'title': 'Bird watching walk', 'detail': 'Estuary viewpoints and the tide line.'},
            {'time': '13:00', 'title': 'Village lunch', 'detail': 'Seafood meal with a fishing family.'},
            {'time': '16:00', 'title': 'Listen to the Ocean', 'detail': 'Headphones on: dolphin clicks, shrimp snaps, boat noise.'},
            {'time': '18:00', 'title': 'Sunset & stories', 'detail': 'Elders share sea stories on the shore.'},
        ],
        lat=10.03, lng=76.23,
        families=['Vypin Tharavadu Family', 'Neendakara Dasa Kudumbam'],
    ),
]

REVIEWS = [
    ('Sunrise Traditional Boat Experience', 5, 'Fisherman as storyteller',
     'Murugan did not just steer the boat — he taught us how the nets are set and told us the stories behind the harbour. Worth every rupee.'),
    ('Listen to the Ocean — Underwater Sound Demo', 5, 'A different way to hear the sea',
     'The shrimp snaps surprised everyone. My school group could not stop talking about the dolphin clicks.'),
    ('Mangrove Kayaking through the Creeks', 4, 'Silent and beautiful',
     'Our guide knew every bird. Paddling the creeks at sunrise felt like entering another world.'),
    ('Fisher Village Homestay (per night)', 5, 'Felt like family',
     'Clean room, incredible breakfast, and a night walk through the village. The family earned from homestay, food and guiding — you can see it in the app ledger.'),
    ('Saturday — Life of the Fishing Village', 4, 'The whole village turns out',
     'Fishing demo in the morning, fish curry at noon, music at sunset. Buy the activity pass — it is worth it.'),
]


class Command(BaseCommand):
    help = 'Seed split rules, fisher families, 5-model experiences, packages and reviews. Idempotent.'

    def handle(self, *args, **options):
        # ---- split rules ----
        for data in SPLIT_RULES:
            scope = data['scope']
            existing = SplitRule.objects.filter(scope=scope).first()
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
                existing.save()
            else:
                SplitRule.objects.create(**data)
        self.stdout.write(f'Split rules: {SplitRule.objects.count()} total')

        # ---- families ----
        family_map = {}
        for data in FAMILIES:
            v = village(*data['v'])
            if not v:
                self.stdout.write(self.style.WARNING(f"  village not found: {data['v']}"))
                continue
            fam, created = FisherFamily.objects.update_or_create(
                name=data['name'],
                defaults=dict(
                    village=v, members_count=data['members'],
                    skills=data['skills'], description=data['description'],
                    is_verified=True, is_active=True,
                    latitude=v.latitude, longitude=v.longitude,
                ),
            )
            family_map[data['name']] = fam
        self.stdout.write(f'Fisher families: {len(family_map)}')

        # ---- experiences ----
        families_by_cat = {}
        created_count = 0
        for data in EXPERIENCES:
            v = village(*data['v'])
            if not v:
                self.stdout.write(self.style.WARNING(f"  village not found: {data['v']} for {data['name']}"))
                continue
            fams = [f for f in family_map.values() if f.village_id == v.id]
            family = fams[0] if fams else None

            defaults = dict(
                opportunity_type=data['otype'],
                model_category=data['cat'],
                description=data['description'],
                village=v, family=family,
                price_min=fdec(data['pmin']), price_max=fdec(data['pmax']),
                price_unit=data['unit'],
                price_range=f"₹{data['pmin']:,}–₹{data['pmax']:,}" if data['pmin'] != data['pmax'] else f"₹{data['pmin']:,}",
                duration=data['duration'], duration_minutes=data['duration_minutes'],
                max_participants=data.get('maxp'),
                highlights=data['highlights'], inclusions=data['inclusions'],
                meeting_point=data['meeting'], is_offshore=data['offshore'],
                lean_season_friendly=not data['offshore'],
                weekday=data.get('weekday', ''),
                is_sustainable=data['sustainable'],
                latitude=data['lat'], longitude=data['lng'],
                is_active=True,
            )
            if data.get('start_time'):
                defaults['start_time'] = data['start_time']
            if data.get('end_time'):
                defaults['end_time'] = data['end_time']

            opp, created = TourismOpportunity.objects.update_or_create(
                name=data['name'], defaults=defaults,
            )
            if created:
                created_count += 1
        self.stdout.write(
            f'Experiences: {TourismOpportunity.objects.count()} total ({created_count} new)'
        )

        # ---- packages ----
        pkg_count = 0
        for data in PACKAGES:
            v = village(*data['v'])
            if not v:
                continue
            pkg, created = ExperiencePackage.objects.update_or_create(
                slug=data['slug'],
                defaults=dict(
                    model_category=data['cat'], title=data['title'],
                    description=data['description'], village=v,
                    price=fdec(data['price']),
                    original_price=fdec(data['original']),
                    duration_text=data['duration'],
                    duration_minutes=data['duration_minutes'],
                    max_participants=data['maxp'],
                    inclusions=data['inclusions'], itinerary=data['itinerary'],
                    latitude=data['lat'], longitude=data['lng'], is_active=True,
                ),
            )
            fams = [family_map[n] for n in data['families'] if n in family_map]
            if fams:
                pkg.families.set(fams)
            if created:
                pkg_count += 1
        self.stdout.write(
            f'Packages: {ExperiencePackage.objects.count()} total ({pkg_count} new)'
        )

        # ---- reviews ----
        review_count = 0
        for exp_name, rating, title, comment in REVIEWS:
            exp = TourismOpportunity.objects.filter(name=exp_name).first()
            if not exp:
                continue
            if Review.objects.filter(experience=exp, title=title).exists():
                continue
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user, _ = User.objects.get_or_create(
                username='demo.traveller',
                defaults=dict(
                    first_name='Demo', last_name='Traveller',
                    role='GUEST', email='demo.traveller@example.com',
                ),
            )
            Review.objects.create(
                user=user, experience=exp, rating=rating, title=title,
                comment=comment, is_verified_stay=True,
            )
            agg = exp.reviews.filter(is_approved=True).aggregate(r=Avg('rating'))
            exp.rating = round(agg['r'] or 0, 2)
            exp.total_reviews = exp.reviews.filter(is_approved=True).count()
            exp.save(update_fields=['rating', 'total_reviews'])
            review_count += 1
        self.stdout.write(f'Reviews: {review_count} new')

        self.stdout.write(self.style.SUCCESS('Ecotourism revamp seed complete.'))
