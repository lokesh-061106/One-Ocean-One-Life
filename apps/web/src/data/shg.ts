import {
  Coins,
  Droplets,
  Dumbbell,
  FileText,
  Fuel,
  HeartPulse,
  PackageCheck,
  ShoppingBasket,
  Sparkles,
  Sun,
  Users,
  UtensilsCrossed,
  Waves,
  Wheat,
  type LucideIcon,
} from "lucide-react";

export type ShgTone =
  | "forest"
  | "sky"
  | "orange"
  | "royal"
  | "purple"
  | "magenta"
  | "turquoise"
  | "ink";

export type ShgAccentTone = Exclude<ShgTone, "ink">;

export interface ShgFigure {
  src: string;
  alt: string;
  caption?: string;
  price?: string;
  /** Fixed crop box for aligned card rows — "auto" keeps the image's natural shape */
  ratio?: string;
}

export interface ShgMetric {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  caption?: string;
  icon: string;
}

/* ------------------------------------------------------------------ */
/*  01 — Circular economy (page 1)                                     */
/* ------------------------------------------------------------------ */

export interface ShgPillar {
  key: string;
  num: string;
  title: string;
  sub: string;
  tone: ShgAccentTone;
  body: string;
  figures: ShgFigure[];
  facts?: string[];
  benefits: string[];
}

export const SHG_PILLARS: ShgPillar[] = [
  {
    key: "upcycling",
    num: "1",
    title: "Upcycling Waste into Wealth",
    sub: "Turning fish waste into useful products",
    tone: "orange",
    body:
      "Fish heads, guts and scales are usually thrown away, creating bad smell, pollution and waste. SHGs collect this waste and convert it into poultry feed, fish meal or organic liquid fertilizer (fish amino acids). This closes the loop by turning biological waste back into a useful nutrient for agriculture and aquaculture.",
    figures: [
      { src: "/shg/p1-woman-processing.webp", alt: "SHG woman sorting fish waste into a crate marked FISH WASTE", caption: "Fish waste collection" },
      { src: "/shg/p1-poultry-feed.webp", alt: "Poultry feed made from processed fish waste", caption: "Poultry feed", price: "₹25–35 / kg" },
      { src: "/shg/p1-fish-meal.webp", alt: "Fish meal powder for animal feed", caption: "Fish meal", price: "₹30–50 / kg" },
      { src: "/shg/p1-liquid-fertilizer.webp", alt: "Bottle of organic liquid fertilizer", caption: "Fish amino acids", price: "₹40–60 / litre" },
    ],
    benefits: [
      "Reduces waste and pollution",
      "Creates additional income for SHGs",
      "Supports agriculture and aquaculture",
      "Cleaner coastal environment",
    ],
  },
  {
    key: "preservation",
    num: "2",
    title: "Extending Product Lifespan via Preservation",
    sub: "Reducing post-harvest losses",
    tone: "sky",
    body:
      "Fresh fish spoils quickly, leading to post-harvest losses of 20–30%. SHGs use solar drying, pickling and smoking techniques to extend the shelf-life of fish, reducing food waste and increasing income.",
    figures: [
      { src: "/shg/p1-solar-yard.webp", alt: "Solar drying yard with racks of drying fish", caption: "Solar drying yard" },
      { src: "/shg/p1-dried-fish.webp", alt: "Sun dried fish", caption: "Dried fish", price: "₹400–600 / kg" },
      { src: "/shg/p1-pickled-fish.webp", alt: "Jars of pickled fish", caption: "Pickled fish", price: "₹300–500 / kg" },
      { src: "/shg/p1-smoked-fish.webp", alt: "Smoked fish", caption: "Smoked fish", price: "₹500–700 / kg" },
    ],
    benefits: [
      "Extends shelf-life from days to months",
      "Reduces food waste (20–30%)",
      "Higher value products for local and export markets",
      "Steady income for SHG members",
    ],
  },
  {
    key: "seaweed",
    num: "3",
    title: "Regenerative Aquaculture (Seaweed)",
    sub: "Good for nature, good for income",
    tone: "forest",
    body:
      "SHGs grow seaweed, which absorbs excess nutrients from the water, acts as a carbon sink and improves water quality. It needs no fresh water or chemical fertilizers and gives a valuable product.",
    figures: [
      { src: "/shg/p1-seaweed-farm.webp", alt: "Seaweed farming lines in coastal water", caption: "Seaweed plots", price: "₹200–400 / kg dried" },
      { src: "/shg/p1-seaweed-woman.webp", alt: "Fisherwoman harvesting seaweed from the water", caption: "Seaweed harvest" },
    ],
    facts: [
      "Dried seaweed is used in food, cosmetics, bio-plastics and fertilizers",
      "Absorbs carbon and excess nutrients",
      "Improves water quality",
      "Needs no fresh water or chemical fertilizers",
      "Commercial product with good market demand",
    ],
    benefits: [
      "Helps to regenerate the marine ecosystem",
      "Acts as a natural carbon sink",
      "Creates new livelihood opportunities",
      "Supports blue economy and climate action",
    ],
  },
];

export const SHG_CIRCULAR_METRICS: ShgMetric[] = [
  { value: 30, suffix: "%", label: "Less Food Waste", caption: "Post-harvest losses of 20–30% are avoided", icon: "leaf" },
  { value: 7, label: "Value-Added Products", caption: "Feed, meal, fertilizer, dried, pickled, smoked, seaweed", icon: "recycle" },
  { value: 400, prefix: "₹", label: "Best Price / kg", caption: "Dried seaweed sells for ₹200–400 per kg", icon: "coins" },
];

/* ------------------------------------------------------------------ */
/*  02 — Deepening strategies (page 2)                                 */
/* ------------------------------------------------------------------ */

export interface ShgStrategy {
  key: string;
  num: string;
  title: string;
  sub: string;
  tone: ShgAccentTone;
  lead: string;
  problem: string;
  solution: string;
  benefits: string[];
  figures: ShgFigure[];
}

export const SHG_STRATEGIES: ShgStrategy[] = [
  {
    key: "packaging",
    num: "1",
    title: "Sustainable Packaging",
    sub: "Eliminating plastics",
    tone: "forest",
    lead: "Replace single-use plastics with eco-friendly and reusable options.",
    problem:
      "Fish vending and dried fish packaging rely heavily on single-use plastics, which pollute the ocean and harm marine life.",
    solution:
      "Train and equip SHGs to use seaweed-based biodegradable packaging or bio-plastics from local starch. For fresh fish deliveries, use reusable, insulated bamboo or recycled plastic crates with a deposit-return scheme.",
    benefits: [
      "Reduces plastic waste and pollution",
      "Eco-friendly products attract more customers",
      "Sale of biodegradable packaging: ₹5–20 per pack",
      "Reusable crate rental/deposit: ₹10–50 per crate",
      "Builds a green brand for SHG products",
    ],
    figures: [
      { src: "/shg/p2-plastic-waste.webp", alt: "Single-use plastic waste washed up on the shore", caption: "Plastic waste" },
      { src: "/shg/p2-bio-bags.webp", alt: "100% biodegradable packaging bags", caption: "Biodegradable packs" },
      { src: "/shg/p2-crates.webp", alt: "Reusable crates carrying fresh fish", caption: "Reusable crates" },
    ],
  },
  {
    key: "energy",
    num: "2",
    title: "Renewable Energy in Processing",
    sub: "Reducing carbon footprint",
    tone: "orange",
    lead: "Use clean energy for drying, ice making and cold storage.",
    problem:
      "Traditional fish drying is weather dependent, and cold storage relies on costly grid electricity or diesel.",
    solution:
      "Install hybrid solar-tunnel dryers for fish drying. Introduce solar-powered ice flake machines and cold storage units at landing centers.",
    benefits: [
      "Year-round processing, higher product quality",
      "Lower electricity/diesel cost (saves ₹30,000–50,000/year)",
      "More products can be processed and stored",
      "Service fee for using drying/ice/cold storage: ₹50–200 per day (per member)",
      "Reliable income and reduced post-harvest loss",
    ],
    figures: [
      { src: "/shg/p2-solar-tunnel.webp", alt: "Hybrid solar tunnel dryer for fish", caption: "Solar-tunnel dryer" },
      { src: "/shg/p2-solar-ice.webp", alt: "Solar ice flake machine and cold storage unit", caption: "Solar ice & cold storage" },
    ],
  },
  {
    key: "chitin",
    num: "3",
    title: "Chitin Extraction from Shellfish Waste",
    sub: "High-value upcycling",
    tone: "purple",
    lead: "Turn crab, shrimp and prawn shells into high-value products.",
    problem:
      "Crab, shrimp and prawn shells are tough waste and take a long time to decompose, often dumped in landfills or near coastal areas.",
    solution:
      "Partner SHGs with local biotech institutes to extract chitin and chitosan from seafood shells. Chitin is a high-value biopolymer used in eco-friendly packaging, cosmetics, agriculture and water purification.",
    benefits: [
      "Converts waste into high-value products",
      "Chitin/Chitosan selling price: ₹2,000–5,000 per kg",
      "New market opportunities (packaging, cosmetics, water treatment, agriculture)",
      "Cleaner coastal environment",
      "Higher income and skilled jobs for SHG members",
    ],
    figures: [
      { src: "/shg/p2-shell-waste.webp", alt: "Crab, shrimp and prawn shells piled as waste", caption: "Shell waste" },
      { src: "/shg/p2-chitin.webp", alt: "Chitin and chitosan powder extracted from shells", caption: "Chitin / Chitosan" },
      { src: "/shg/p2-eco-icons.webp", alt: "Eco packaging, cosmetics and water purification uses of chitosan", caption: "Eco-friendly uses" },
    ],
  },
  {
    key: "assets",
    num: "4",
    title: "Shared Asset Pooling",
    sub: "Product-as-a-service",
    tone: "royal",
    lead: "Use common facilities to reduce cost and ensure zero food waste.",
    problem:
      "Buying individual cold-storage units or transport vehicles is too expensive for solo fish vendors. Unsold catch often spoils due to lack of storage.",
    solution:
      "The SHG can own a centralized \u201cCold-Chain Hub\u201d powered by solar energy. Members pay a small usage fee to store their catch, use ice, or hire refrigerated transport. This ensures high asset utilization and zero food waste due to lack of storage.",
    benefits: [
      "Affordable access to cold storage and transport",
      "Usage fee for cold storage: ₹10–20 per kg per day",
      "Vehicle usage fee: ₹500–1,000 per day",
      "Reduces food spoilage and increases market reach",
      "Shared ownership builds stronger SHG cooperation",
      "Higher and more stable income for all members",
    ],
    figures: [
      { src: "/shg/p2-cold-hub.webp", alt: "Solar powered SHG cold-chain hub with fish crates", caption: "SHG Cold-Chain Hub" },
      { src: "/shg/p2-truck.webp", alt: "Refrigerated transport truck for SHG fish", caption: "Refrigerated transport" },
    ],
  },
];

export const SHG_STRATEGY_METRICS: ShgMetric[] = [
  { value: 4, label: "Key Strategies", caption: "Packaging, energy, chitin and shared assets", icon: "target" },
  { value: 50000, prefix: "₹", label: "Energy Savings / year", caption: "₹30,000–50,000 saved on power and diesel", icon: "fuel" },
  { value: 5000, prefix: "₹", label: "Chitin Price / kg", caption: "Chitin and chitosan sell for ₹2,000–5,000", icon: "sparkles" },
];

/* ------------------------------------------------------------------ */
/*  03 — Revenue opportunities (page 3)                                */
/* ------------------------------------------------------------------ */

export interface ShgRevenueRow {
  key: string;
  activity: string;
  what: string;
  market: string;
  price: string;
  income: string;
  figure?: ShgFigure;
}

export const SHG_REVENUE_ROWS: ShgRevenueRow[] = [
  {
    key: "feed",
    activity: "Fish meal / Poultry feed",
    what: "Process fish waste (heads, guts, scales)",
    market: "Poultry farms, aquaculture farms, animal feed suppliers",
    price: "₹30–50 per kg",
    income: "₹30,000–75,000 (1,000–1,500 kg / month)",
    figure: { src: "/shg/p3-meal-feed.webp", alt: "Fish meal and poultry feed produced from fish waste" },
  },
  {
    key: "fertilizer",
    activity: "Organic liquid fertilizer (fish amino acids)",
    what: "Ferment fish waste into liquid fertilizer",
    market: "Organic farmers, home gardeners, plant nurseries",
    price: "₹40–60 per litre",
    income: "₹20,000–60,000 (500–1,000 litre / month)",
    figure: { src: "/shg/p3-fertilizer.webp", alt: "Bottles of organic liquid fertilizer" },
  },
  {
    key: "dried",
    activity: "Dried fish",
    what: "Clean and sun/solar dry fish",
    market: "Local markets, wholesalers, export markets",
    price: "₹400–600 per kg",
    income: "₹40,000–1,00,000 (100–200 kg / month)",
    figure: { src: "/shg/p3-dried-fish.webp", alt: "Dried fish ready for market" },
  },
  {
    key: "value",
    activity: "Pickled / smoked fish",
    what: "Value-added processing (pickling, smoking, ready-to-eat)",
    market: "Local markets, online sales, tourism, retail stores",
    price: "₹300–700 per kg",
    income: "₹30,000–70,000 (100–200 kg / month)",
    figure: { src: "/shg/p3-pickled-fish.webp", alt: "Pickled and smoked fish products" },
  },
  {
    key: "seaweed",
    activity: "Seaweed",
    what: "Cultivation and drying of seaweed",
    market: "Food industry, cosmetics, bio-plastics, fertilizer companies",
    price: "₹200–400 per kg",
    income: "₹20,000–80,000 (200–300 kg / month)",
    figure: { src: "/shg/p3-seaweed.webp", alt: "Seaweed harvest" },
  },
  {
    key: "chitin",
    activity: "Chitin / Chitosan",
    what: "Extract chitin/chitosan from shrimp, crab and prawn shells",
    market: "Pharmaceuticals, cosmetics, water treatment, biodegradable packaging",
    price: "₹2,000–5,000 per kg",
    income: "₹1,00,000–3,00,000 (50–100 kg / month)",
    figure: { src: "/shg/p3-chitin.webp", alt: "Chitin and chitosan extracted from shellfish waste" },
  },
  {
    key: "cold",
    activity: "Cold storage services",
    what: "Rent out storage space to members or local fishers",
    market: "Fish vendors, small traders, SHG members",
    price: "₹10–20 per kg per day",
    income: "₹20,000–50,000 (depending on usage)",
    figure: { src: "/shg/p3-cold-storage.webp", alt: "Cold storage facility with fish crates" },
  },
  {
    key: "transport",
    activity: "Transport services",
    what: "Rent refrigerated transport vehicle",
    market: "Fish distribution, local markets, hotels, retailers",
    price: "₹500–1,000 per day",
    income: "₹15,000–30,000 (15–30 days / month)",
    figure: { src: "/shg/p3-transport.webp", alt: "Refrigerated vehicle used for fish transport" },
  },
];

export const SHG_REVENUE_METRICS: ShgMetric[] = [
  { value: 8, label: "Revenue Streams", caption: "Products and services from one catch", icon: "hand-coins" },
  { value: 300000, prefix: "₹", label: "Top Monthly Income", caption: "Chitin / chitosan: ₹1–3 lakh per month", icon: "banknote" },
  { value: 700, prefix: "₹", label: "Best Price / kg", caption: "Smoked and value-added fish", icon: "sparkles" },
];

export const SHG_REVENUE_CHIPS = [
  "Income for Women",
  "Stronger SHGs",
  "Less Waste",
  "Cleaner Oceans",
  "Greener Future",
];

/* ------------------------------------------------------------------ */
/*  04 — Loans and financial support (page 4)                          */
/* ------------------------------------------------------------------ */

export interface ShgLoanStep {
  key: string;
  num: string;
  title: string;
  points: string[];
  figure?: ShgFigure;
}

export const SHG_LOAN_STEPS: ShgLoanStep[] = [
  {
    key: "form",
    num: "1",
    title: "Form or Strengthen Your SHG",
    points: ["10–20 members (fisherwomen)", "Regular meetings and savings", "Maintain minutes, accounts and records"],
    figure: { src: "/shg/p4-shg-meeting.webp", alt: "Fisherwomen SHG members meeting around a table" },
  },
  {
    key: "plan",
    num: "2",
    title: "Prepare a Business Plan",
    points: [
      "Choose an activity (e.g., fish processing, seaweed farming, bio-fertilizer, cold storage)",
      "Estimate cost, expected income and market",
      "Get help from NGOs, fisheries department or technical experts",
    ],
    figure: { src: "/shg/p4-business-plan.webp", alt: "Business plan checklist with products, machinery, cost, market and expected income" },
  },
  {
    key: "bank",
    num: "3",
    title: "Approach a Bank",
    points: [
      "Preferably a bank linked with SHGs (e.g., SBI, Indian Bank, Canara Bank, local cooperative bank)",
      "Submit application with required documents",
      "Bank will assess your plan and repayment capacity",
    ],
    figure: { src: "/shg/p4-bank.webp", alt: "SHG members approaching a bank branch" },
  },
  {
    key: "linkage",
    num: "4",
    title: "Use SHG–Bank Linkage Program",
    points: [
      "SHGs with good savings records can get loans more easily",
      "Start with a small loan and build a good repayment history for larger loans",
    ],
    figure: { src: "/shg/p4-loan-approved.webp", alt: "Loan approved stamp on an application" },
  },
  {
    key: "support",
    num: "5",
    title: "Get Additional Support",
    points: [
      "Avail subsidy or margin money under government schemes",
      "Seek training and technical support",
      "Use loan for productive assets and income generating activities",
    ],
    figure: { src: "/shg/p4-solar-equipment.webp", alt: "Solar dryer and cold storage equipment financed by SHG loans" },
  },
];

export interface ShgScheme {
  name: string;
  purpose: string;
  amount: string;
}

export const SHG_SCHEMES: ShgScheme[] = [
  { name: "SHG–Bank Linkage Program (NABARD)", purpose: "General business activities for SHGs", amount: "₹50,000 – 10 lakh" },
  { name: "PM Matsya Sampada Yojana (PMSY)", purpose: "Fish processing, cold chain, seaweed farming, infrastructure", amount: "₹10 lakh – 2 crore (subsidy 40–60%)" },
  { name: "Kisan Credit Card (Fisheries)", purpose: "Working capital for fisherfolk", amount: "Up to ₹3 lakh" },
  { name: "Mudra Loan (Shishu/Kishor/Tarun)", purpose: "Small business, equipment, working capital", amount: "₹50,000 – 10 lakh" },
  { name: "Stand-Up India / Startup India", purpose: "Innovative seafood products, bio-packaging, value addition", amount: "₹10 lakh – 1 crore" },
  { name: "State Fisheries Department Schemes (Tamil Nadu)", purpose: "Boats, gear, processing units, solar equipment, marketing support", amount: "₹50,000 – 50 lakh (with subsidy)" },
];

export const SHG_DOCUMENTS = [
  "SHG registration certificate (if available)",
  "Member list with signatures",
  "Minutes of meetings and savings records",
  "Business plan / project report",
  "Identity proof and address proof (Aadhaar, PAN, etc.)",
  "Bank account details (SHG account)",
  "Quotations for equipment/machinery",
  "Any other document required by the bank or scheme",
];

export interface ShgSupportItem {
  title: string;
  detail: string;
  icon: LucideIcon;
}

export const SHG_OTHER_SUPPORT: ShgSupportItem[] = [
  { title: "Training and technical support", detail: "From Fisheries Dept., NABARD, NGOs", icon: Dumbbell },
  { title: "Market linkage support", detail: "For local and export markets", icon: ShoppingBasket },
  { title: "Subsidies for equipment", detail: "Solar dryers, cold storage, processing units", icon: Sun },
  { title: "Help with certification", detail: "For eco-friendly and organic products", icon: FileText },
];

export const SHG_LOAN_METRICS: ShgMetric[] = [
  { value: 5, label: "Steps to a Loan", caption: "From forming the SHG to extra support", icon: "target" },
  { value: 6, label: "Government Schemes", caption: "Central and state support for SHGs", icon: "building" },
  { value: 20000000, prefix: "₹", label: "Highest Scheme Limit", caption: "PM Matsya Sampada Yojana: up to ₹2 crore", icon: "building" },
];

/* ------------------------------------------------------------------ */
/*  05 — Recipes (page 5)                                              */
/* ------------------------------------------------------------------ */

export interface ShgRecipe {
  key: string;
  no: number;
  fish: string;
  tamil: string;
  translit: string;
  dish: string;
  ingredients: string[];
  cook: string;
  serve: string;
  fishFigure: ShgFigure;
  dishFigure: ShgFigure;
}

export const SHG_RECIPES: ShgRecipe[] = [
  {
    key: "sardine",
    no: 1,
    fish: "Sardine",
    tamil: "மத்தி",
    translit: "Mathi / Chaalai",
    dish: "Spicy Sardine Curry",
    ingredients: ["Onion, tomato, garlic", "Chilli, tamarind", "Curry leaves"],
    cook: "Cook for 8–10 minutes",
    serve: "Best with rice, idli or dosa",
    fishFigure: { src: "/shg/r01-sardine-fish.webp", alt: "Fresh sardines" },
    dishFigure: { src: "/shg/r01-sardine-dish.webp", alt: "Spicy sardine curry" },
  },
  {
    key: "mackerel",
    no: 2,
    fish: "Indian Mackerel",
    tamil: "காணாங்கெதுத்தி",
    translit: "Kaanang Keluthi",
    dish: "Kerala-style Mackerel Fry",
    ingredients: ["Chilli, turmeric", "Ginger-garlic, lemon", "Rice flour"],
    cook: "Shallow-fry until crisp",
    serve: "Best as street food",
    fishFigure: { src: "/shg/r02-mackerel-fish.webp", alt: "Fresh Indian mackerel" },
    dishFigure: { src: "/shg/r02-mackerel-dish.webp", alt: "Kerala style mackerel fry" },
  },
  {
    key: "seer",
    no: 3,
    fish: "Seer / King Fish",
    tamil: "வங்குரம்",
    translit: "Vanjaram",
    dish: "Tawa Seer Fish",
    ingredients: ["Chilli, turmeric, pepper", "Ginger-garlic, lemon"],
    cook: "Pan-cook 4–5 min each side",
    serve: "Best with rice or chapati",
    fishFigure: { src: "/shg/r03-seer-fish.webp", alt: "Seer fish steaks" },
    dishFigure: { src: "/shg/r03-seer-dish.webp", alt: "Tawa fried seer fish" },
  },
  {
    key: "pomfret",
    no: 4,
    fish: "Pomfret",
    tamil: "வாவல்",
    translit: "Vavval",
    dish: "Pepper-Garlic Pomfret Fry",
    ingredients: ["Garlic, pepper, turmeric", "Chilli, lemon"],
    cook: "Marinate and fry until golden",
    serve: "Best as beach restaurant meal",
    fishFigure: { src: "/shg/r04-pomfret-fish.webp", alt: "Fresh pomfret" },
    dishFigure: { src: "/shg/r04-pomfret-dish.webp", alt: "Pepper garlic pomfret fry" },
  },
  {
    key: "tuna",
    no: 5,
    fish: "Tuna",
    tamil: "சூறை",
    translit: "Sura / Soorai",
    dish: "Tuna Coconut Curry",
    ingredients: ["Onion, tomato, coconut", "Chilli, tamarind"],
    cook: "Simmer for 10–12 min",
    serve: "Best with rice or chapati",
    fishFigure: { src: "/shg/r05-tuna-fish.webp", alt: "Fresh tuna" },
    dishFigure: { src: "/shg/r05-tuna-dish.webp", alt: "Tuna coconut curry" },
  },
  {
    key: "anchovy",
    no: 6,
    fish: "Anchovy",
    tamil: "நெத்தலி",
    translit: "Nethili",
    dish: "Crispy Nethili Fry",
    ingredients: ["Chilli, turmeric", "Ginger-garlic, rice flour"],
    cook: "Fry until crispy",
    serve: "Perfect street snack",
    fishFigure: { src: "/shg/r06-anchovy-fish.webp", alt: "Fresh anchovies" },
    dishFigure: { src: "/shg/r06-anchovy-dish.webp", alt: "Crispy fried anchovies" },
  },
  {
    key: "threadfin",
    no: 7,
    fish: "Threadfin Bream",
    tamil: "சங்கரா",
    translit: "Sankara",
    dish: "Chettinad Fish Curry",
    ingredients: ["Onion, tomato, chilli", "Coriander, fennel, tamarind"],
    cook: "Cook for 8–10 minutes",
    serve: "Best with steamed rice",
    fishFigure: { src: "/shg/r07-threadfin-fish.webp", alt: "Fresh threadfin bream" },
    dishFigure: { src: "/shg/r07-threadfin-dish.webp", alt: "Chettinad fish curry" },
  },
  {
    key: "ribbon",
    no: 8,
    fish: "Ribbon Fish",
    tamil: "வாலை",
    translit: "Vaalai",
    dish: "Spicy Ribbon-Fish Fry",
    ingredients: ["Chilli, turmeric", "Ginger-garlic, pepper", "Rice flour"],
    cook: "Shallow-fry until crisp",
    serve: "Tasty beach snack",
    fishFigure: { src: "/shg/r08-ribbon-fish.webp", alt: "Fresh ribbon fish" },
    dishFigure: { src: "/shg/r08-ribbon-dish.webp", alt: "Spicy ribbon fish fry" },
  },
  {
    key: "bass",
    no: 9,
    fish: "Barramundi / Sea Bass",
    tamil: "கொடுவா",
    translit: "Koduva",
    dish: "Coconut Fish Curry",
    ingredients: ["Onion, tomato, green chilli", "Coconut milk"],
    cook: "Simmer gently for 5 min",
    serve: "Best with rice or appam",
    fishFigure: { src: "/shg/r09-bass-fish.webp", alt: "Fresh sea bass" },
    dishFigure: { src: "/shg/r09-bass-dish.webp", alt: "Coconut fish curry" },
  },
  {
    key: "snapper",
    no: 10,
    fish: "Red Snapper",
    tamil: "செங்கலி",
    translit: "Sengali / Sankara",
    dish: "South Indian Masala Fry",
    ingredients: ["Chilli, turmeric, coriander", "Ginger-garlic, lemon"],
    cook: "Shallow-fry until crisp",
    serve: "Great for family meals",
    fishFigure: { src: "/shg/r10-snapper-fish.webp", alt: "Fresh red snapper" },
    dishFigure: { src: "/shg/r10-snapper-dish.webp", alt: "South Indian masala fish fry" },
  },
];

/* ------------------------------------------------------------------ */
/*  06 — Fresh fish marketing (page 6)                                 */
/* ------------------------------------------------------------------ */

export interface ShgFishName {
  lang: string;
  script: string;
  translit: string;
}

export interface ShgFreshFish {
  key: string;
  no: number;
  english: string;
  tamil: string;
  translit: string;
  names: ShgFishName[];
  figure: ShgFigure;
}

export const SHG_FRESH_FISH: ShgFreshFish[] = [
  {
    key: "sardine",
    no: 1,
    english: "Sardine",
    tamil: "மத்தி / சாளை",
    translit: "Mathi / Chaalai",
    names: [
      { lang: "Malayalam", script: "മത്തി / ചാള", translit: "Mathi / Chaala" },
      { lang: "Kannada", script: "ಬೂಥಾಯಿ / ತಾರ್ಲೆ", translit: "Boothai / Tarle" },
      { lang: "Telugu", script: "కవ్వలు", translit: "Kavallu" },
    ],
    figure: { src: "/shg/f01-sardine.webp", alt: "Fresh sardines with a prepared dish" },
  },
  {
    key: "mackerel",
    no: 2,
    english: "Indian Mackerel",
    tamil: "காணாங்கெதுத்தி",
    translit: "Kaanang Keluthi",
    names: [
      { lang: "Malayalam", script: "അയല / അയില", translit: "Ayala / Ayila" },
      { lang: "Kannada", script: "ಬಂಗಡೆ", translit: "Bangde" },
      { lang: "Telugu", script: "బంగార", translit: "Bangada" },
    ],
    figure: { src: "/shg/f02-mackerel.webp", alt: "Fresh Indian mackerel with a prepared dish" },
  },
  {
    key: "seer",
    no: 3,
    english: "Seer / King Fish",
    tamil: "வங்குரம் / வங்குரம்",
    translit: "Vanjaram",
    names: [
      { lang: "Malayalam", script: "നെയ്മീൻ / ആയകൂര", translit: "Neymeen / Ayakoora" },
      { lang: "Kannada", script: "ಅಂಜಲ್", translit: "Anjal" },
      { lang: "Telugu", script: "వంజరం", translit: "Vanjaram" },
    ],
    figure: { src: "/shg/f03-seer.webp", alt: "Fresh seer fish with a prepared dish" },
  },
  {
    key: "pomfret",
    no: 4,
    english: "Pomfret",
    tamil: "வாவல்",
    translit: "Vavval",
    names: [
      { lang: "Malayalam", script: "അവോലി", translit: "Avoli" },
      { lang: "Kannada", script: "ಮಾಂಜಿ / ಪಾಪ್ಲೆಟ್", translit: "Manji / Paplet" },
      { lang: "Telugu", script: "చందువ", translit: "Chanduva" },
    ],
    figure: { src: "/shg/f04-pomfret.webp", alt: "Fresh pomfret with a prepared dish" },
  },
  {
    key: "tuna",
    no: 5,
    english: "Tuna",
    tamil: "சூறை",
    translit: "Sura / Soorai",
    names: [
      { lang: "Malayalam", script: "ചൂര / കേര", translit: "Choora / Kera" },
      { lang: "Kannada", script: "ಚೂರೆ", translit: "Choore" },
      { lang: "Telugu", script: "చేపల గూడ", translit: "Soora" },
    ],
    figure: { src: "/shg/f05-tuna.webp", alt: "Fresh tuna with a prepared dish" },
  },
  {
    key: "anchovy",
    no: 6,
    english: "Anchovy",
    tamil: "நெத்தலி",
    translit: "Nethili",
    names: [
      { lang: "Malayalam", script: "നതോലി / കൊഴുവ", translit: "Natholi / Kozhuva" },
      { lang: "Kannada", script: "ಬೊಳಿನೆ", translit: "Boline" },
      { lang: "Telugu", script: "నెత్తలి", translit: "Nethali" },
    ],
    figure: { src: "/shg/f06-anchovy.webp", alt: "Fresh anchovies with a prepared dish" },
  },
  {
    key: "threadfin",
    no: 7,
    english: "Threadfin Bream",
    tamil: "சங்கரா",
    translit: "Sankara",
    names: [
      { lang: "Malayalam", script: "ചെമ്പല്ലി", translit: "Chempalli" },
      { lang: "Kannada", script: "ರಾಣಿ ಮೀನು", translit: "Rani Meenu" },
      { lang: "Telugu", script: "రాణి చేప", translit: "Rani Chepa" },
    ],
    figure: { src: "/shg/f07-threadfin.webp", alt: "Fresh threadfin bream with a prepared dish" },
  },
  {
    key: "ribbon",
    no: 8,
    english: "Ribbon Fish",
    tamil: "வாலை / வாலை",
    translit: "Vaalai",
    names: [
      { lang: "Malayalam", script: "വാല / വാൽമീൻ", translit: "Vaala" },
      { lang: "Kannada", script: "ಬಾಳೆ ಮೀನು", translit: "Baale Meenu" },
      { lang: "Telugu", script: "వాల చేప", translit: "Vaala" },
    ],
    figure: { src: "/shg/f08-ribbon.webp", alt: "Fresh ribbon fish with a prepared dish" },
  },
  {
    key: "bass",
    no: 9,
    english: "Barramundi / Sea Bass",
    tamil: "கொடுவா",
    translit: "Koduva",
    names: [
      { lang: "Malayalam", script: "കാളാഞ്ചി / കൊടുവ", translit: "Kaalanchi / Koduva" },
      { lang: "Kannada", script: "ಕಾಳಾಂಜಿ", translit: "Kalaanji" },
      { lang: "Telugu", script: "కాళాంజి", translit: "Kalanji" },
    ],
    figure: { src: "/shg/f09-bass.webp", alt: "Fresh sea bass with a prepared dish" },
  },
  {
    key: "snapper",
    no: 10,
    english: "Red Snapper",
    tamil: "செங்கலி / சங்கரா",
    translit: "Sengali / Sankara",
    names: [
      { lang: "Malayalam", script: "ചെമ്പല്ലി", translit: "Chempalli" },
      { lang: "Kannada", script: "ಶಂಕರಾ ಮೀನು", translit: "Shankara meenu" },
      { lang: "Telugu", script: "శంకరా", translit: "Shankara" },
    ],
    figure: { src: "/shg/f10-snapper.webp", alt: "Fresh red snapper with a prepared dish" },
  },
];

export const SHG_HEALTH_CHIPS = [
  { icon: HeartPulse, label: "Rich in Omega-3" },
  { icon: Dumbbell, label: "High Protein" },
  { icon: Users, label: "Supports Local Fisherfolk" },
];

export const SHG_FRESH_METRICS: ShgMetric[] = [
  { value: 10, label: "Popular Local Fishes", caption: "Named in Tamil, Malayalam, Kannada and Telugu", icon: "fish" },
  { value: 4, label: "Languages", caption: "Sell in the language your customer speaks", icon: "waves" },
  { value: 3, label: "Health Reasons", caption: "Omega-3, protein and support for fishing families", icon: "heart" },
];

/* ------------------------------------------------------------------ */
/*  07 — Sea to plate to prosperity (page 7)                           */
/* ------------------------------------------------------------------ */

export interface ShgStage {
  key: string;
  num: string;
  title: string;
  tamil: string;
  points: string[];
  figure?: ShgFigure;
}

export const SHG_STAGES: ShgStage[] = [
  {
    key: "harvest",
    num: "1",
    title: "Harvest",
    tamil: "மீன்பிடி - நிலையான மீன்பிடி",
    points: ["Right season", "Right size", "Right method", "Healthy fish stock"],
    figure: { src: "/shg/p7-harvest.webp", alt: "Fishermen and fisherwomen at sustainable harvest" },
  },
  {
    key: "landing",
    num: "2",
    title: "Landing & Sorting at Harbour",
    tamil: "கடற்கரையில் இறக்குதல் மற்றும் தரப்படுத்தல்",
    points: ["Sort by species and size", "Remove damaged fish early", "Clean and keep on ice", "Better quality gets better price"],
    figure: { src: "/shg/p7-landing.webp", alt: "Fish sorted into crates at the harbour" },
  },
  {
    key: "market",
    num: "3",
    title: "Local Market & Street Sales",
    tamil: "உள்ளூர் சந்தை மற்றும் தெரு விற்பனை",
    points: ["Fresh & local", "Affordable", "Direct from fishers", "Supports families"],
    figure: { src: "/shg/p7-market.webp", alt: "Street market sale of fresh fish" },
  },
  {
    key: "meals",
    num: "4",
    title: "Fresh Meals at Beaches",
    tamil: "கடற்கரையில் சுவையான மீன் உணவு",
    points: ["Grilled fish", "Fish fry", "Fish curry with rice", "Healthy & tasty", "Creates local jobs (self-help groups)"],
    figure: { src: "/shg/p7-meals.webp", alt: "Fresh fish meals served at a beach stall" },
  },
  {
    key: "value",
    num: "5",
    title: "Value Added Products",
    tamil: "மீன் மதிப்பு சேர்த்தல் தயாரிப்புகள்",
    points: ["Longer shelf life", "Higher value", "More income for women's groups", "Can be sold online too"],
  },
  {
    key: "employment",
    num: "6",
    title: "Local Employment & Income Generation",
    tamil: "உள்ளூர் வேலைவாய்ப்பு மற்றும் வருமானம்",
    points: ["Fishermen", "Fisherwomen", "Vendors", "Food stall owners", "Women's self-help groups"],
  },
  {
    key: "byproduct",
    num: "7",
    title: "By-product Utilization (Zero Waste)",
    tamil: "துணை உற்பத்திகள் - முழு வீண்வீக்கம்",
    points: ["Nothing goes to waste – everything has value"],
  },
  {
    key: "future",
    num: "8",
    title: "Better Future",
    tamil: "நிலையான வருங்காலம்",
    points: [
      "Healthy diet for children",
      "Stronger fishing communities",
      "Cleaner coasts and oceans",
      "Steady income throughout the year",
      "Pride in our local fish and culture",
    ],
    figure: { src: "/shg/p7-children.webp", alt: "Children enjoying a healthy fish meal" },
  },
];

export interface ShgValueProduct {
  title: string;
  tamil: string;
  figure: ShgFigure;
}

export const SHG_VALUE_PRODUCTS: ShgValueProduct[] = [
  { title: "Dried Fish", tamil: "உலர் மீன்", figure: { src: "/shg/p7-vp-dried.webp", alt: "Dried fish" } },
  { title: "Fish Pickle", tamil: "மீன் ஊறுகாய்", figure: { src: "/shg/p7-vp-pickle.webp", alt: "Fish pickle jar" } },
  { title: "Fish Cutlet", tamil: "மீன் கட்லெட்", figure: { src: "/shg/p7-vp-cutlet.webp", alt: "Fish cutlets" } },
  { title: "Ready-to-Cook", tamil: "மசாலா மீன்", figure: { src: "/shg/p7-vp-ready.webp", alt: "Ready to cook masala fish pack" } },
  { title: "Fish Masala", tamil: "மீன் மசாலா", figure: { src: "/shg/p7-vp-masala.webp", alt: "Fish masala pack" } },
];

export interface ShgRole {
  title: string;
  detail: string;
  points: string[];
  figure: ShgFigure;
}

export const SHG_ROLES: ShgRole[] = [
  { title: "Fishermen", detail: "Better price for quality fish", points: ["Steady income"], figure: { src: "/shg/p7-role-fishermen.webp", alt: "Fisherman with his catch" } },
  { title: "Fisherwomen", detail: "Processing, drying, value addition", points: ["Self-help groups income"], figure: { src: "/shg/p7-role-fisherwomen.webp", alt: "Fisherwoman processing fish" } },
  { title: "Vendors", detail: "Market and street sales", points: ["Direct income"], figure: { src: "/shg/p7-role-vendors.webp", alt: "Fish vendor at the market" } },
  { title: "Food Stall Owners", detail: "Fresh meals at beaches", points: ["Tourism income"], figure: { src: "/shg/p7-role-stall.webp", alt: "Beach food stall owner" } },
  { title: "Women's Self-Help Groups", detail: "Pickles, dried fish, masala", points: ["Online and local sales"], figure: { src: "/shg/p7-role-shg.webp", alt: "Women's self-help group selling value added fish products" } },
];

export interface ShgByProduct {
  title: string;
  output: string;
  tamil: string;
  icon: LucideIcon;
  figure: ShgFigure;
}

export const SHG_BYPRODUCTS: ShgByProduct[] = [
  { title: "Fish Heads & Bones", output: "Fish Meal & Organic Fertilizer", tamil: "மீன் மாவு / உரம்", icon: Wheat, figure: { src: "/shg/p7-bp-heads.webp", alt: "Fish heads and bones used for fish meal and fertilizer" } },
  { title: "Fish Skin", output: "Collagen", tamil: "தோல் கலப்பு (Skincare / Health)", icon: Sparkles, figure: { src: "/shg/p7-bp-skin.webp", alt: "Fish skin collagen for skincare and health" } },
  { title: "Fish Oil", output: "Omega-3", tamil: "மீன் எண்ணெய் (Health supplements)", icon: Droplets, figure: { src: "/shg/p7-bp-oil.webp", alt: "Fish oil omega-3 supplements" } },
  { title: "Scales", output: "Handicrafts", tamil: "ஐம்பொது பொருட்கள்", icon: PackageCheck, figure: { src: "/shg/p7-bp-scales.webp", alt: "Handicrafts made from fish scales" } },
  { title: "Waste to Biogas", output: "Clean Energy", tamil: "வைகல் எரிவாயு", icon: Fuel, figure: { src: "/shg/p7-bp-biogas.webp", alt: "Biogas plant producing clean energy from fish waste" } },
];

export const SHG_SDGS = [
  { num: "2", label: "Zero Hunger" },
  { num: "8", label: "Decent Work & Economic Growth" },
  { num: "12", label: "Responsible Consumption & Production" },
  { num: "14", label: "Life Below Water" },
];

export const SHG_WHEEL = [
  { title: "PEOPLE", detail: "Fishermen · Fisherwomen · Vendors · Local Communities", icon: Users },
  { title: "OCEAN", detail: "Sustainable use of marine resources", icon: Waves },
  { title: "INCOME", detail: "Better prices · More jobs · Value addition", icon: Coins },
  { title: "FOOD", detail: "Nutritious local meals", icon: UtensilsCrossed },
];

export const SHG_SEA_METRICS: ShgMetric[] = [
  { value: 8, label: "Stages of the Journey", caption: "From harvest to a better future", icon: "recycle" },
  { value: 5, label: "Value-Added Products", caption: "Dried, pickle, cutlet, ready-to-cook, masala", icon: "package" },
  { value: 0, label: "Waste Generated", caption: "Nothing goes to waste – everything has value", icon: "leaf" },
];

export const SHG_DISCLAIMER =
  "Indicative information – verify current scheme guidelines, prices and eligibility with your bank, fisheries department or SHG federation before acting.";
