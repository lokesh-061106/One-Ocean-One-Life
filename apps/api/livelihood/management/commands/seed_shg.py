from django.core.management.base import BaseCommand
from livelihood.models import ShgSection, RevenueItem, LoanScheme, FishProduct, Recipe


SECTIONS = [
    {
        'key': 'circular-economy', 'num': '01', 'label': 'Circular Economy',
        'title': 'Why the Current SHG Model is Already a Circular Economy',
        'subtitle': 'Fisherwomen SHGs are already practicing a circular economy by reducing waste, reusing resources and regenerating nature.',
        'message': ['From Waste', 'to Wealth', 'for Cleaner Seas', 'and Stronger Communities'],
        'slogan': 'Fisherwomen SHGs: People, Prosperity and a Healthier Ocean',
        'tagline': '', 'chain': ['Less Waste', 'More Income', 'Cleaner Environment', 'Stronger Communities'],
        'sign': 'CLEAN SEAS · BRIGHTER FUTURES', 'tone': 'forest', 'sort_order': 1,
    },
    {
        'key': 'strategies', 'num': '02', 'label': 'Deepening the Model',
        'title': 'How to Bring / Deepen the Circular Economy',
        'subtitle': 'Four key strategies to make Fisherwomen SHGs a full zero-waste, sustainable model',
        'message': ['Local Resources', 'Clean Energy', 'More Value', 'Stronger Communities'],
        'slogan': '“Women Led • Waste to Wealth • Healthy Oceans • Sustainable Future”',
        'tagline': '', 'chain': ['Clean Energy', 'Smart Technology', 'Zero Waste', 'A Stronger Blue Economy'],
        'sign': 'OUR OCEAN · OUR LIVELIHOOD · OUR FUTURE', 'tone': 'ocean', 'sort_order': 2,
    },
    {
        'key': 'revenue', 'num': '03', 'label': 'Revenue Opportunities',
        'title': 'Revenue Opportunities for Fisherwomen SHGs',
        'subtitle': 'Multiple products and services can generate steady income throughout the year',
        'message': ['From Local Resources', 'to Brighter', 'Futures'],
        'slogan': 'Women Create Value from the Sea',
        'tagline': 'Healthy Oceans  |  Prosperous Communities  |  Brighter Tomorrows',
        'chain': [], 'sign': 'Sustainable Livelihoods for Fisherwomen', 'tone': 'ocean', 'sort_order': 3,
    },
    {
        'key': 'loans', 'num': '04', 'label': 'Loans & Financial Support',
        'title': 'How to Get Loans and Financial Support',
        'subtitle': 'Turn your ideas into income — Banks and Government are ready to support Fisherwomen SHGs!',
        'message': ['Financial Support', 'for Stronger', 'Fisherwomen', 'and Cleaner Oceans'],
        'slogan': 'Financial Support + Training + Market Linkages = Sustainable Income for Fisherwomen SHGs',
        'tagline': '', 'chain': [], 'sign': 'STRONG SHGs · PROSPEROUS FISHERWOMEN · CLEANER OCEANS',
        'tone': 'purple', 'sort_order': 4,
    },
    {
        'key': 'recipes', 'num': '05', 'label': 'Recipes & Food Marketing',
        'title': '10 Popular South Indian Fishes — Simple & Delicious Recipes',
        'subtitle': 'Fresh from Our Coast to Your Plate!',
        'message': ['Local Fish', 'Traditional Recipe', 'Fresh from Coast'],
        'slogan': 'Try Local · Buy Fresh · Support Fisherwomen',
        'tagline': 'Fresh from Our Coast to Your Plate!', 'chain': [],
        'sign': 'ORDER FROM YOUR LOCAL SHG', 'tone': 'orange', 'sort_order': 5,
    },
    {
        'key': 'fresh-fish', 'num': '06', 'label': 'Fresh Fish Marketing',
        'title': 'Fresh from the Sea — Delicious on Your Plate!',
        'subtitle': 'Local Fishes · Local Flavours · Healthy Lives',
        'message': ['Rich in Omega-3', 'High Protein', 'Supports Local Fisherfolk'],
        'slogan': 'Tasty Fishes · Healthier Families · Stronger Coastal Communities',
        'tagline': 'Buy Local. Eat Fresh. Support Fisherwomen.', 'chain': [],
        'sign': 'FRESH FROM THE SEA', 'tone': 'ocean', 'sort_order': 6,
    },
    {
        'key': 'sea-to-plate', 'num': '07', 'label': 'From Sea to Plate to Prosperity',
        'title': 'From Sea to Plate to Prosperity',
        'subtitle': 'A Circular Economy for Our Coastal Communities',
        'message': ['கடல் வளம் • நம் உணவு • நம் வாழ்வு'],
        'slogan': 'Nothing goes to waste — Everything has value!',
        'tagline': 'Healthy Oceans • Prosperous Communities • Sustainable Livelihoods',
        'chain': [], 'sign': 'FROM SEA → PLATE → PROSPERITY', 'tone': 'forest', 'sort_order': 7,
    },
]

REVENUE_ITEMS = [
    ('feed', 'Fish meal / Poultry feed', 'Process fish waste (heads, guts, scales)',
     'Poultry farms, aquaculture farms, animal feed suppliers', '₹30–50 per kg',
     '₹30,000–75,000 (1,000–1,500 kg / month)', '/shg/p3-meal-feed.webp'),
    ('fertilizer', 'Organic liquid fertilizer (fish amino acids)', 'Ferment fish waste into liquid fertilizer',
     'Organic farmers, home gardeners, plant nurseries', '₹40–60 per litre',
     '₹20,000–60,000 (500–1,000 litre / month)', '/shg/p3-fertilizer.webp'),
    ('dried', 'Dried fish', 'Clean and sun/solar dry fish',
     'Local markets, wholesalers, export markets', '₹400–600 per kg',
     '₹40,000–1,00,000 (100–200 kg / month)', '/shg/p3-dried-fish.webp'),
    ('value', 'Pickled / smoked fish', 'Value-added processing (pickling, smoking, ready-to-eat)',
     'Local markets, online sales, tourism, retail stores', '₹300–700 per kg',
     '₹30,000–70,000 (100–200 kg / month)', '/shg/p3-pickled-fish.webp'),
    ('seaweed', 'Seaweed', 'Cultivation and drying of seaweed',
     'Food industry, cosmetics, bio-plastics, fertilizer companies', '₹200–400 per kg',
     '₹20,000–80,000 (200–300 kg / month)', '/shg/p3-seaweed.webp'),
    ('chitin', 'Chitin / Chitosan', 'Extract chitin/chitosan from shrimp, crab and prawn shells',
     'Pharmaceuticals, cosmetics, water treatment, biodegradable packaging', '₹2,000–5,000 per kg',
     '₹1,00,000–3,00,000 (50–100 kg / month)', '/shg/p3-chitin.webp'),
    ('cold', 'Cold storage services', 'Rent out storage space to members or local fishers',
     'Fish vendors, small traders, SHG members', '₹10–20 per kg per day',
     '₹20,000–50,000 (depending on usage)', '/shg/p3-cold-storage.webp'),
    ('transport', 'Transport services', 'Rent refrigerated transport vehicle',
     'Fish distribution, local markets, hotels, retailers', '₹500–1,000 per day',
     '₹15,000–30,000 (15–30 days / month)', '/shg/p3-transport.webp'),
]

SCHEMES = [
    ('SHG–Bank Linkage Program (NABARD)', 'General business activities for SHGs', '₹50,000 – 10 lakh'),
    ('PM Matsya Sampada Yojana (PMSY)', 'Fish processing, cold chain, seaweed farming, infrastructure',
     '₹10 lakh – 2 crore (subsidy 40–60%)'),
    ('Kisan Credit Card (Fisheries)', 'Working capital for fisherfolk', 'Up to ₹3 lakh'),
    ('Mudra Loan (Shishu/Kishor/Tarun)', 'Small business, equipment, working capital', '₹50,000 – 10 lakh'),
    ('Stand-Up India / Startup India', 'Innovative seafood products, bio-packaging, value addition', '₹10 lakh – 1 crore'),
    ('State Fisheries Department Schemes (Tamil Nadu)',
     'Boats, gear, processing units, solar equipment, marketing support', '₹50,000 – 50 lakh (with subsidy)'),
]

FISH = [
    ('Sardine', 'மத்தி / சாளை', 'Mathi / Chaalai', '/shg/f01-sardine.webp',
     [('Malayalam', 'മത്തി / ചാള', 'Mathi / Chaala'), ('Kannada', 'ಬೂಥಾಯಿ / ತಾರ್ಲೆ', 'Boothai / Tarle'),
      ('Telugu', 'కవ్వలు', 'Kavallu')]),
    ('Indian Mackerel', 'காணாங்கெதுத்தி', 'Kaanang Keluthi', '/shg/f02-mackerel.webp',
     [('Malayalam', 'അയല / അയില', 'Ayala / Ayila'), ('Kannada', 'ಬಂಗಡೆ', 'Bangde'),
      ('Telugu', 'బంగార', 'Bangada')]),
    ('Seer / King Fish', 'வங்குரம் / வங்குரம்', 'Vanjaram', '/shg/f03-seer.webp',
     [('Malayalam', 'നെയ്മീൻ / ആയകൂര', 'Neymeen / Ayakoora'), ('Kannada', 'ಅಂಜಲ್', 'Anjal'),
      ('Telugu', 'వంజరం', 'Vanjaram')]),
    ('Pomfret', 'வாவல்', 'Vavval', '/shg/f04-pomfret.webp',
     [('Malayalam', 'അവോലി', 'Avoli'), ('Kannada', 'ಮಾಂಜಿ / ಪಾಪ್ಲೆಟ್', 'Manji / Paplet'),
      ('Telugu', 'చందువ', 'Chanduva')]),
    ('Tuna', 'சூறை', 'Sura / Soorai', '/shg/f05-tuna.webp',
     [('Malayalam', 'ചൂര / കേര', 'Choora / Kera'), ('Kannada', 'ಚೂರೆ', 'Choore'),
      ('Telugu', 'చేపల గూడ', 'Soora')]),
    ('Anchovy', 'நெத்தலி', 'Nethili', '/shg/f06-anchovy.webp',
     [('Malayalam', 'നതോലി / കൊഴുവ', 'Natholi / Kozhuva'), ('Kannada', 'ಬೊಳಿನೆ', 'Boline'),
      ('Telugu', 'నెత్తలి', 'Nethali')]),
    ('Threadfin Bream', 'சங்கரா', 'Sankara', '/shg/f07-threadfin.webp',
     [('Malayalam', 'ചെമ്പല്ലി', 'Chempalli'), ('Kannada', 'ರಾಣಿ ಮೀನು', 'Rani Meenu'),
      ('Telugu', 'రాణి చేప', 'Rani Chepa')]),
    ('Ribbon Fish', 'வாலை / வாலை', 'Vaalai', '/shg/f08-ribbon.webp',
     [('Malayalam', 'വാല / വാൽമീൻ', 'Vaala'), ('Kannada', 'ಬಾಳೆ ಮೀನು', 'Baale Meenu'),
      ('Telugu', 'వాల చేప', 'Vaala')]),
    ('Barramundi / Sea Bass', 'கொடுவா', 'Koduva', '/shg/f09-bass.webp',
     [('Malayalam', 'കാളാഞ്ചി / കൊടുവ', 'Kaalanchi / Koduva'), ('Kannada', 'ಕಾಳಾಂಜಿ', 'Kalaanji'),
      ('Telugu', 'కాళాంజి', 'Kalanji')]),
    ('Red Snapper', 'செங்கலி / சங்கரா', 'Sengali / Sankara', '/shg/f10-snapper.webp',
     [('Malayalam', 'ചെമ്പല്ലി', 'Chempalli'), ('Kannada', 'Regional names vary', ''),
      ('Telugu', 'Regional names vary', '')]),
]

RECIPES = [
    ('Sardine', 'மத்தி', 'Mathi / Chaalai', 'Spicy Sardine Curry',
     ['Onion, tomato, garlic', 'Chilli, tamarind', 'Curry leaves'],
     'Cook for 8–10 minutes', 'Best with rice, idli or dosa',
     '/shg/r01-sardine-fish.webp', '/shg/r01-sardine-dish.webp'),
    ('Indian Mackerel', 'காணாங்கெதுத்தி', 'Kaanang Keluthi', 'Kerala-style Mackerel Fry',
     ['Chilli, turmeric', 'Ginger-garlic, lemon', 'Rice flour'],
     'Shallow-fry until crisp', 'Best as street food',
     '/shg/r02-mackerel-fish.webp', '/shg/r02-mackerel-dish.webp'),
    ('Seer / King Fish', 'வங்குரம்', 'Vanjaram', 'Tawa Seer Fish',
     ['Chilli, turmeric, pepper', 'Ginger-garlic, lemon'],
     'Pan-cook 4–5 min each side', 'Best with rice or chapati',
     '/shg/r03-seer-fish.webp', '/shg/r03-seer-dish.webp'),
    ('Pomfret', 'வாவல்', 'Vavval', 'Pepper-Garlic Pomfret Fry',
     ['Garlic, pepper, turmeric', 'Chilli, lemon'],
     'Marinate and fry until golden', 'Best as beach restaurant meal',
     '/shg/r04-pomfret-fish.webp', '/shg/r04-pomfret-dish.webp'),
    ('Tuna', 'சூறை', 'Sura / Soorai', 'Tuna Coconut Curry',
     ['Onion, tomato, coconut', 'Chilli, tamarind'],
     'Simmer for 10–12 min', 'Best with rice or chapati',
     '/shg/r05-tuna-fish.webp', '/shg/r05-tuna-dish.webp'),
    ('Anchovy', 'நெத்தலி', 'Nethili', 'Crispy Nethili Fry',
     ['Chilli, turmeric', 'Ginger-garlic, rice flour'],
     'Fry until crispy', 'Perfect street snack',
     '/shg/r06-anchovy-fish.webp', '/shg/r06-anchovy-dish.webp'),
    ('Threadfin Bream', 'சங்கரா', 'Sankara', 'Chettinad Fish Curry',
     ['Onion, tomato, chilli', 'Coriander, fennel, tamarind'],
     'Cook for 8–10 minutes', 'Best with steamed rice',
     '/shg/r07-threadfin-fish.webp', '/shg/r07-threadfin-dish.webp'),
    ('Ribbon Fish', 'வாலை', 'Vaalai', 'Spicy Ribbon-Fish Fry',
     ['Chilli, turmeric', 'Ginger-garlic, pepper', 'Rice flour'],
     'Shallow-fry until crisp', 'Tasty beach snack',
     '/shg/r08-ribbon-fish.webp', '/shg/r08-ribbon-dish.webp'),
    ('Barramundi / Sea Bass', 'கொடுவா', 'Koduva', 'Coconut Fish Curry',
     ['Onion, tomato, green chilli', 'Coconut milk'],
     'Simmer gently for 5 min', 'Best with rice or appam',
     '/shg/r09-bass-fish.webp', '/shg/r09-bass-dish.webp'),
    ('Red Snapper', 'செங்கலி', 'Sengali / Sankara', 'South Indian Masala Fry',
     ['Chilli, turmeric, coriander', 'Ginger-garlic, lemon'],
     'Shallow-fry until crisp', 'Great for family meals',
     '/shg/r10-snapper-fish.webp', '/shg/r10-snapper-dish.webp'),
]


class Command(BaseCommand):
    help = "Seed the Fisherwomen SHG handbook content (sections, revenue items, schemes, fish, recipes)"

    def handle(self, *args, **options):
        sections = {}
        for data in SECTIONS:
            section, _ = ShgSection.objects.update_or_create(key=data['key'], defaults=data)
            sections[data['key']] = section

        revenue_section = sections['revenue']
        for order, (key, activity, what, market, price, income, image) in enumerate(REVENUE_ITEMS, start=1):
            RevenueItem.objects.update_or_create(
                section=revenue_section, activity=activity,
                defaults={
                    'key': key, 'what': what, 'market': market, 'price': price,
                    'income': income, 'image': image, 'sort_order': order,
                },
            )

        loans_section = sections['loans']
        for order, (name, purpose, amount) in enumerate(SCHEMES, start=1):
            LoanScheme.objects.update_or_create(
                name=name,
                defaults={'purpose': purpose, 'amount': amount, 'sort_order': order,
                          'section': loans_section},
            )

        for order, (english, tamil, translit, image, names) in enumerate(FISH, start=1):
            FishProduct.objects.update_or_create(
                english=english,
                defaults={
                    'tamil': tamil, 'translit': translit, 'image': image,
                    'names': [{'lang': lang, 'script': script, 'translit': tr}
                              for lang, script, tr in names],
                    'sort_order': order,
                },
            )

        for order, (fish, tamil, translit, dish, ingredients, cook, serve, fish_image, dish_image) in enumerate(RECIPES, start=1):
            Recipe.objects.update_or_create(
                fish=fish, dish=dish,
                defaults={
                    'tamil': tamil, 'translit': translit, 'ingredients': ingredients,
                    'cook': cook, 'serve': serve, 'fish_image': fish_image,
                    'dish_image': dish_image, 'sort_order': order,
                },
            )

        self.stdout.write(self.style.SUCCESS(
            f"SHG content seeded: {ShgSection.objects.count()} sections, "
            f"{RevenueItem.objects.count()} revenue items, {LoanScheme.objects.count()} schemes, "
            f"{FishProduct.objects.count()} fish products, {Recipe.objects.count()} recipes"
        ))
