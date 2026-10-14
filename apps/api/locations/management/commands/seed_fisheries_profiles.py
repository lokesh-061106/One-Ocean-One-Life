from django.core.management.base import BaseCommand

from locations.models import StateFisheriesProfile, StateLeanPeriod

DATA_NOTE = (
    "Data are from the latest official/state sources available for each indicator. "
    "Reference years differ between states and indicators; therefore, figures should "
    "not be interpreted as a single-year census."
)

PROFILES = [
    {
        "state": "Andhra Pradesh",
        "slug": "andhra-pradesh",
        "latitude": 15.8,
        "longitude": 80.7,
        "coastal_length_km": "974",
        "eez": "~0.31 million km²",
        "continental_shelf_km2": "~33,000",
        "coastal_districts": 9,
        "marine_fishing_villages": "533",
        "fisherfolk_population": "~5.17 lakh",
        "welfare_registered": "Not verified from current official source",
        "mechanized_crafts": 6965,
        "motorized_crafts": 12078,
        "non_motorized_crafts": 1176,
        "total_crafts": 20219,
        "agencies": [
            {"name": "AFCOF", "detail": "Andhra Pradesh State Fishermen Cooperative Societies Federation"},
            {"name": "FCS", "detail": "Primary and district-level fishermen cooperative societies"},
            {"name": "Matsya Mitra Groups (MMGs)", "detail": "Fisherwomen/community livelihood groups"},
            {"name": "Fishing Harbour & Landing Centre Development", "detail": "Development and management of marine fisheries infrastructure"},
            {"name": "Fisheries Extension & Welfare Services", "detail": "Fishermen welfare, subsidies, fishing-ban relief and livelihood support"},
        ],
        "ban_relief_text": "Fishing Ban Relief – ₹20,000 per eligible sea-going fisher family",
        "lean_allowance_text": (
            "Livelihood and nutritional support is also implemented under PMMSY during "
            "the ban/lean period"
        ),
        "period_remarks": (
            "Annual marine fishing ban: 15 April–14 June (61 days). AP increased the "
            "state fishing-ban assistance from ₹10,000 to ₹20,000 per family from "
            "2025–26. (Department of Finance)"
        ),
        "lean_periods": [
            {
                "district": "",
                "region_label": "Coastal Andhra – generally",
                "typical_period": "April–May",
                "start_month": 4,
                "start_day": 15,
                "end_month": 6,
                "end_day": 14,
                "main_reason": (
                    "The annual fishing-ban period makes April–May a particularly "
                    "low-activity period for mechanised fisheries. Historical CMFRI "
                    "analysis identifies April–May as the lean period, while "
                    "November–January is the peak season. (CMFRI Digital Repository)"
                ),
                "confidence": (
                    "Good, but avoid assigning different months to every district "
                    "without district-specific data"
                ),
            },
        ],
    },
    {
        "state": "Karnataka",
        "slug": "karnataka",
        "latitude": 13.5,
        "longitude": 74.7,
        "coastal_length_km": "300",
        "eez": "87,000 km²",
        "continental_shelf_km2": "27,000",
        "coastal_districts": 3,
        "marine_fishing_villages": "162",
        "fisherfolk_population": "~1.58 lakh",
        "welfare_registered": "Not verified from current official source",
        "mechanized_crafts": 2225,
        "motorized_crafts": 5879,
        "non_motorized_crafts": 3780,
        "total_crafts": 11884,
        "agencies": [
            {"name": "KFDC", "detail": "Karnataka Fisheries Development Corporation"},
            {"name": "KSCFF", "detail": "Karnataka State Co-operative Fisheries Federation"},
            {"name": "Directorate of Fisheries", "detail": "Marine and inland fisheries development and welfare"},
            {"name": "Fisheries Extension/District Offices", "detail": "Field-level implementation and fisher services"},
            {"name": "Fishing Harbour & Marine Infrastructure", "detail": "Harbour, landing and related infrastructure development"},
        ],
        "ban_relief_text": (
            "Matsya Asha Kiran – state top-up/support for fishermen affected by "
            "seasonal fishing restrictions"
        ),
        "lean_allowance_text": (
            "Savings-cum-Relief Scheme: ₹1,500 fisherman contribution + ₹1,500 Central "
            "+ ₹3,000 State = ₹6,000, distributed during lean months"
        ),
        "period_remarks": (
            "State documents describe distribution during 3 lean months. The State "
            "increased its contribution under Matsya Asha Kiran from ₹1,500 to "
            "₹3,000. (Department of Finance)"
        ),
        "lean_periods": [
            {
                "district": "Uttara Kannada",
                "region_label": "Uttara Kannada",
                "typical_period": "June–July",
                "start_month": 6,
                "start_day": 1,
                "end_month": 7,
                "end_day": 31,
                "main_reason": (
                    "Southwest monsoon and seasonal fishing restrictions reduce fishing "
                    "activity. The present uniform west-coast ban is 1 June–31 July. (MPEDA)"
                ),
                "confidence": "Good for seasonal closure; moderate for “lean” classification",
            },
            {
                "district": "Udupi",
                "region_label": "Udupi",
                "typical_period": "June–July",
                "start_month": 6,
                "start_day": 1,
                "end_month": 7,
                "end_day": 31,
                "main_reason": "Monsoon conditions and fishing restrictions.",
                "confidence": "Good for seasonal closure; moderate for “lean” classification",
            },
            {
                "district": "Dakshina Kannada",
                "region_label": "Dakshina Kannada",
                "typical_period": "June–July",
                "start_month": 6,
                "start_day": 1,
                "end_month": 7,
                "end_day": 31,
                "main_reason": "Monsoon conditions and fishing restrictions.",
                "confidence": "Good for seasonal closure; moderate for “lean” classification",
            },
        ],
    },
    {
        "state": "Kerala",
        "slug": "kerala",
        "latitude": 9.4,
        "longitude": 76.4,
        "coastal_length_km": "589.5–590",
        "eez": "218,536 km²",
        "continental_shelf_km2": "39,139",
        "coastal_districts": 9,
        "marine_fishing_villages": "220–222",
        "fisherfolk_population": "10.49 lakh",
        "welfare_registered": "3,09,806 registered fisherfolk",
        "mechanized_crafts": 4016,
        "motorized_crafts": 13868,
        "non_motorized_crafts": 3800,
        "total_crafts": 21684,
        "agencies": [
            {"name": "Matsyafed", "detail": "Kerala State Co-operative Federation for Fisheries Development Ltd"},
            {"name": "KFWFB", "detail": "Kerala Fishermen’s Welfare Fund Board"},
            {"name": "ADAK", "detail": "Agency for Development of Aquaculture"},
            {"name": "SFMC", "detail": "State Fisheries Management Council"},
            {"name": "KSCADC", "detail": "Kerala State Coastal Area Development Corporation"},
            {"name": "SAF", "detail": "Society for Assistance to Fisherwomen"},
            {"name": "KAVIL", "detail": "Kerala Aqua Ventures International Ltd"},
            {"name": "Marine Enforcement Cell", "detail": "Fisheries marine enforcement and surveillance"},
        ],
        "ban_relief_text": (
            "Fishing/Trawl-ban relief measures, including free ration for workers of "
            "mechanized boats, peeling workers and allied workers during the 2026 "
            "trawl-ban period"
        ),
        "lean_allowance_text": (
            "Savings-cum-Relief Scheme: current Government Services Portal describes "
            "₹4,500 support, with ₹1,500 paid in each of three months for marine fishers"
        ),
        "period_remarks": (
            "Marine fishing-ban period is generally during the monsoon season. "
            "Kerala's 2026 order specifically provided free ration during the "
            "trawl-ban period. (Fisheries Department Kerala)"
        ),
        "lean_periods": [
            {
                "district": "",
                "region_label": "Kerala coast – generally",
                "typical_period": "June–July",
                "start_month": 6,
                "start_day": 1,
                "end_month": 7,
                "end_day": 31,
                "main_reason": (
                    "Southwest monsoon, rough sea conditions and seasonal fishing "
                    "restrictions. The present national west-coast closure is 1 June–31 "
                    "July, while Kerala's specific trawl-ban arrangements can differ. (MPEDA)"
                ),
                "confidence": "Good for seasonal restriction; moderate for general “lean” period",
            },
            {
                "district": "Alappuzha",
                "region_label": "Alappuzha",
                "typical_period": "Monsoon period, especially June–July",
                "start_month": 6,
                "start_day": 1,
                "end_month": 7,
                "end_day": 31,
                "main_reason": (
                    "Important qualification: monsoon mud-bank (chakara) fisheries can "
                    "provide good fishing opportunities, so “lean” is not uniform "
                    "throughout Kerala. (Sage Journals)"
                ),
                "confidence": "Use with qualification",
            },
            {
                "district": "Ernakulam",
                "region_label": "Ernakulam",
                "typical_period": "Monsoon period, especially June–July",
                "start_month": 6,
                "start_day": 1,
                "end_month": 7,
                "end_day": 31,
                "main_reason": (
                    "Monsoon affects fishing activity, but mud-bank and prawn fisheries "
                    "can provide alternative opportunities. (ResearchGate)"
                ),
                "confidence": "Use with qualification",
            },
            {
                "district": "Thrissur",
                "region_label": "Thrissur",
                "typical_period": "Monsoon period, especially June–July",
                "start_month": 6,
                "start_day": 1,
                "end_month": 7,
                "end_day": 31,
                "main_reason": "Seasonal/monsoon effects; local fisheries can vary. (ResearchGate)",
                "confidence": "Use with qualification",
            },
        ],
    },
    {
        "state": "Tamil Nadu",
        "slug": "tamil-nadu",
        "latitude": 10.3,
        "longitude": 79.9,
        "coastal_length_km": "1,076",
        "eez": "~190,000 km²",
        "continental_shelf_km2": "41,412",
        "coastal_districts": 14,
        "marine_fishing_villages": "608",
        "fisherfolk_population": "10.48 lakh",
        "welfare_registered": "4,38,906",
        "mechanized_crafts": 5824,
        "motorized_crafts": 41716,
        "non_motorized_crafts": 4119,
        "total_crafts": 51659,
        "agencies": [
            {"name": "TNFDC", "detail": "Tamil Nadu Fisheries Development Corporation"},
            {"name": "TAFCOFED", "detail": "Tamil Nadu State Apex Fisheries Co-operative Federation"},
            {"name": "TNFWB", "detail": "Tamil Nadu Fishermen Welfare Board"},
            {"name": "MEW", "detail": "Marine Enforcement Wing"},
            {"name": "FHPC", "detail": "Fishing Harbour Project Circle"},
        ],
        "ban_relief_text": "Fishing Ban Period Assistance – ₹8,000 per eligible marine fisher family",
        "lean_allowance_text": (
            "Special Allowance during Fishing Lean Period – ₹7,000 per traditional "
            "fisher family under the 2026–27 budget announcement"
        ),
        "period_remarks": (
            "East coast: 15 April–14 June; Kanniyakumari west coast: 1 June–31 July. "
            "Tamil Nadu's 2026–27 Budget increased lean-period assistance from ₹6,000 "
            "to ₹7,000. (Scribd)"
        ),
        "lean_periods": [
            {
                "district": "",
                "region_label": "Northern & central/eastern coast",
                "typical_period": "October–March, varying by district",
                "start_month": 10,
                "start_day": 1,
                "end_month": 3,
                "end_day": 31,
                "main_reason": (
                    "Northeast monsoon, rough-sea conditions and weather warnings can "
                    "reduce fishing days. The State's lean-period assistance is "
                    "specifically intended for this period. (Scribd)"
                ),
                "confidence": "Good",
            },
            {
                "district": "Thoothukudi",
                "region_label": "Thoothukudi",
                "typical_period": "Around April onward",
                "start_month": 4,
                "start_day": 15,
                "end_month": 6,
                "end_day": 14,
                "main_reason": (
                    "Historical state policy documents indicate that the lean season in "
                    "Thoothukudi begins around April. (doczz.net)"
                ),
                "confidence": "Good historical evidence; verify current district schedule",
            },
            {
                "district": "Tirunelveli",
                "region_label": "Tirunelveli",
                "typical_period": "Around April onward",
                "start_month": 4,
                "start_day": 15,
                "end_month": 6,
                "end_day": 14,
                "main_reason": (
                    "Historical state policy documents similarly identify the lean season "
                    "as commencing around April. (doczz.net)"
                ),
                "confidence": "Good historical evidence; verify current district schedule",
            },
            {
                "district": "Kanniyakumari",
                "region_label": "Kanniyakumari – east coast",
                "typical_period": "April–June fishing-ban period",
                "start_month": 4,
                "start_day": 15,
                "end_month": 6,
                "end_day": 14,
                "main_reason": "East-coast seasonal closure applies. (MPEDA)",
                "confidence": "Good for ban period",
            },
            {
                "district": "Kanniyakumari",
                "region_label": "Kanniyakumari – west coast",
                "typical_period": "June–July",
                "start_month": 6,
                "start_day": 1,
                "end_month": 7,
                "end_day": 31,
                "main_reason": (
                    "West-coast seasonal closure applies to the western part of "
                    "Kanniyakumari. (Niti For States)"
                ),
                "confidence": "Good for ban period",
            },
        ],
    },
]


class Command(BaseCommand):
    help = (
        "Seed StateFisheriesProfile + StateLeanPeriod reference data for the four "
        "southern coastal states. Idempotent (upsert by slug)."
    )

    def handle(self, *args, **options):
        profiles_created = profiles_updated = 0
        lean_created = lean_updated = 0

        for data in PROFILES:
            data = dict(data)
            rows = data.pop("lean_periods")
            data["data_note"] = DATA_NOTE
            profile, created = StateFisheriesProfile.objects.update_or_create(
                slug=data["slug"],
                defaults=data,
            )
            if created:
                profiles_created += 1
            else:
                profiles_updated += 1

            for order, row in enumerate(rows):
                lean, lean_created_row = StateLeanPeriod.objects.get_or_create(
                    profile=profile,
                    region_label=row["region_label"],
                    defaults={**row, "order": order},
                )
                if lean_created_row:
                    lean_created += 1
                else:
                    changed = False
                    for field, value in {**row, "order": order}.items():
                        if getattr(lean, field) != value:
                            setattr(lean, field, value)
                            changed = True
                    if changed:
                        lean.save()
                    lean_updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"State fisheries profiles: {profiles_created} created, "
                f"{profiles_updated} existing | lean periods: {lean_created} created, "
                f"{lean_updated} existing"
            )
        )
