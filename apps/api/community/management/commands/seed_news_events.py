from datetime import datetime
from zoneinfo import ZoneInfo

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from community.models import Event

IST = ZoneInfo("Asia/Kolkata")


def dt(year, month, day, hour, minute=0):
    return datetime(year, month, day, hour, minute, tzinfo=IST)


NEWS_EVENTS = [
    {
        "title": "Satellite Oceanography & QGIS Training",
        "event_type": "education",
        "location_name": "Hyderabad / Hybrid",
        "start_date": dt(2026, 8, 17, 9),
        "end_date": dt(2026, 8, 28, 17),
        "point": Point(78.4763, 17.4435, srid=4326),
        "max_participants": 60,
        "description": (
            "<p><strong>📅 Date:</strong> 17–28 August 2026<br>"
            "<strong>🏛️ Institute:</strong> INCOIS, Hyderabad<br>"
            "<strong>📍 Location:</strong> Hyderabad / Hybrid<br>"
            "<strong>🔬 Topic:</strong> Satellite remote sensing and GIS</p>"
            "<h3>What happened</h3>"
            "<p>INCOIS conducted a two-week hands-on training programme on Satellite Oceanography "
            "and QGIS, covering satellite-data analysis, spatial data generation, coastal monitoring "
            "and environmental assessment. The programme helped students, researchers and professionals "
            "develop practical skills for analysing ocean and coastal conditions using satellite "
            "observations and GIS. Such technologies can support applications including fisheries, "
            "coastal-zone management, marine pollution monitoring and ecosystem assessment.</p>"
            "<h3>💡 Why it matters</h3>"
            "<p>🛰️ Satellite + GIS data can help scientists understand large areas of the ocean "
            "that cannot be monitored continuously by ships.</p>"
        ),
    },
    {
        "title": "Kallakadal Warning for South Tamil Nadu",
        "event_type": "awareness",
        "location_name": "Kerala, South Tamil Nadu & Lakshadweep",
        "start_date": dt(2026, 8, 18, 10),
        "end_date": dt(2026, 8, 20, 18),
        "point": Point(77.55, 8.08, srid=4326),
        "max_participants": 100,
        "description": (
            "<p><strong>📅 Date:</strong> 18 August 2026<br>"
            "<strong>🏛️ Institute:</strong> INCOIS<br>"
            "<strong>📍 Region:</strong> Kerala, South Tamil Nadu &amp; Lakshadweep<br>"
            "<strong>🔬 Topic:</strong> Swell surge / coastal hazards</p>"
            "<h3>What happened</h3>"
            "<p>INCOIS issued a Swell Surge (Kallakadal) warning for Kerala, South Tamil Nadu and "
            "Lakshadweep for 19–20 August. Long-period swell waves generated far away in the southern "
            "Indian Ocean can travel thousands of kilometres and reach India's coast, producing "
            "unusually energetic waves and temporary coastal flooding, particularly during high tide. "
            "Such warnings provide important information for fishermen, coastal communities, ports and "
            "disaster-management authorities.</p>"
            "<h3>💡 Why it matters</h3>"
            "<p>🌊 An ocean event occurring far from India can still affect Indian coastal villages "
            "several days later.</p>"
        ),
    },
    {
        "title": "High-Value Marine Ornamental Fish Training",
        "event_type": "workshop",
        "location_name": "Mandapam & Tuticorin, Tamil Nadu",
        "start_date": dt(2026, 8, 17, 9),
        "end_date": dt(2026, 8, 21, 17),
        "point": Point(79.12, 9.28, srid=4326),
        "max_participants": 40,
        "description": (
            "<p><strong>📅 Date:</strong> 17–21 August 2026<br>"
            "<strong>🏛️ Institute:</strong> ICAR-CMFRI<br>"
            "<strong>📍 Location:</strong> Mandapam &amp; Tuticorin, Tamil Nadu<br>"
            "<strong>🔬 Topic:</strong> Marine ornamental fish breeding</p>"
            "<h3>What happened</h3>"
            "<p>ICAR-CMFRI conducted training on high-value marine ornamental fish breeding and culture "
            "at its Mandapam Regional Centre and Tuticorin Regional Station. Participants learned about "
            "breeding clownfish and damselfish, larval rearing, live-feed production, water-quality "
            "management, disease management, recirculating aquaculture systems and marine ornamental "
            "resources of the Gulf of Mannar and Palk Bay.</p>"
            "<h3>💡 Why it matters</h3>"
            "<p>🐠 Scientific breeding and culture can create alternative livelihood opportunities "
            "while reducing pressure on wild ornamental fish resources.</p>"
        ),
    },
    {
        "title": "Marine Research Aquarium & Mariculture Centre",
        "event_type": "research",
        "location_name": "Calicut, Kerala",
        "start_date": dt(2026, 8, 20, 10),
        "end_date": dt(2026, 8, 20, 16),
        "point": Point(75.7804, 11.2583, srid=4326),
        "max_participants": 150,
        "description": (
            "<p><strong>📅 Date:</strong> 20 August 2026<br>"
            "<strong>🏛️ Institute:</strong> ICAR-CMFRI<br>"
            "<strong>📍 Location:</strong> Calicut, Kerala<br>"
            "<strong>🔬 Topic:</strong> Marine research, outreach &amp; mariculture</p>"
            "<h3>What happened</h3>"
            "<p>ICAR-CMFRI inaugurated a redeveloped Marine Research Aquarium and Mariculture Research "
            "and Training Centre at its Calicut Regional Station. The aquarium will support public "
            "awareness and scientific communication about marine biodiversity and fisheries, while the "
            "mariculture centre will provide practical training, technology demonstrations and skill "
            "development for sustainable marine farming.</p>"
            "<h3>💡 Why it matters</h3>"
            "<p>🐟 Research becomes more useful when scientific technologies reach students, fishermen, "
            "entrepreneurs and coastal communities.</p>"
        ),
    },
    {
        "title": "Mangrove Restoration for Coastal Protection",
        "event_type": "cleanup",
        "location_name": "Coastal Kerala",
        "start_date": dt(2026, 8, 12, 8),
        "end_date": dt(2026, 8, 12, 17),
        "point": Point(76.2673, 9.9312, srid=4326),
        "max_participants": 200,
        "description": (
            "<p><strong>📅 Date:</strong> 12 August 2026<br>"
            "<strong>🏛️ Institute:</strong> ICAR-CMFRI<br>"
            "<strong>📍 Location:</strong> Coastal Kerala<br>"
            "<strong>🔬 Topic:</strong> Mangrove restoration</p>"
            "<h3>What happened</h3>"
            "<p>ICAR-CMFRI continued its Plant4Mother – Ek Ped Maa Ke Naam activities, with more than "
            "1,400 mangrove saplings and propagules planted across several coastal locations in Kerala. "
            "The programme included mangrove restoration, nursery development and community-supported "
            "plantation activities. Mangroves provide important nursery habitat for marine organisms "
            "and help strengthen coastal ecosystems against erosion and other environmental pressures.</p>"
            "<h3>💡 Why it matters</h3>"
            "<p>🌱 Healthy coastal habitats support fish nurseries, biodiversity and coastal protection.</p>"
        ),
    },
    {
        "title": "BRICS Ocean & Polar Science Meeting",
        "event_type": "research",
        "location_name": "Goa",
        "start_date": dt(2026, 8, 12, 9),
        "end_date": dt(2026, 8, 14, 18),
        "point": Point(73.8278, 15.4909, srid=4326),
        "max_participants": 80,
        "description": (
            "<p><strong>📅 Date:</strong> 12–14 August 2026<br>"
            "<strong>🏛️ Institute:</strong> NCPOR / Ministry of Earth Sciences<br>"
            "<strong>📍 Location:</strong> Goa<br>"
            "<strong>🔬 Topic:</strong> International ocean &amp; polar cooperation</p>"
            "<h3>What happened</h3>"
            "<p>India hosted the 8th BRICS Working Group Meeting on Ocean and Polar Science and "
            "Technology in Goa. Scientists and representatives from BRICS nations discussed scientific "
            "cooperation, knowledge exchange, ocean research, polar science, technology development and "
            "sustainable use of ocean resources. The meeting also highlighted India's Blue Economy and "
            "Deep Ocean Mission and the importance of international collaboration in understanding and "
            "responsibly using ocean resources.</p>"
            "<h3>💡 Why it matters</h3>"
            "<p>🌏 Oceans cross national boundaries, so countries need to share data, technology and "
            "scientific knowledge.</p>"
        ),
    },
    {
        "title": "Mapping India's Seabed and Marine Geohazards",
        "event_type": "research",
        "location_name": "Lakshadweep Sea & Indian continental margins",
        "start_date": dt(2026, 8, 10, 10),
        "end_date": dt(2026, 8, 10, 16),
        "point": Point(72.6, 10.56, srid=4326),
        "max_participants": 40,
        "description": (
            "<p><strong>📅 Date:</strong> 10 August 2026<br>"
            "<strong>🏛️ Institutes:</strong> NCPOR &amp; Geological Survey of India<br>"
            "<strong>📍 Region:</strong> Lakshadweep Sea &amp; Indian continental margins<br>"
            "<strong>🔬 Topic:</strong> Marine geoscience</p>"
            "<h3>What happened</h3>"
            "<p>NCPOR and the Marine &amp; Coastal Survey Division of the Geological Survey of India "
            "signed an MoU to strengthen collaborative marine geoscience research under India's Indian "
            "EEZ Programme. Initial work will focus on seamount exploration in the Lakshadweep Sea and "
            "studies of submarine geohazards and vulnerability along India's continental margins. The "
            "work will improve scientific understanding of India's seabed and support safer and more "
            "sustainable use of marine resources.</p>"
            "<h3>💡 Why it matters</h3>"
            "<p>🗺️ Knowing what lies beneath the sea helps India understand seamounts, seabed resources, "
            "submarine hazards and marine ecosystems.</p>"
        ),
    },
    {
        "title": "Ocean Data & Fisheries Data Training",
        "event_type": "education",
        "location_name": "Hyderabad",
        "start_date": dt(2026, 8, 31, 9),
        "end_date": dt(2026, 9, 4, 17),
        "point": Point(78.4763, 17.4435, srid=4326),
        "max_participants": 35,
        "description": (
            "<p><strong>📅 Date:</strong> 31 August – 4 September 2026<br>"
            "<strong>🏛️ Institute:</strong> INCOIS<br>"
            "<strong>📍 Location:</strong> Hyderabad<br>"
            "<strong>🔬 Topic:</strong> Data management, statistics &amp; fisheries</p>"
            "<h3>What happened</h3>"
            "<p>INCOIS scheduled a specialised training programme on Data Management, Statistical "
            "Methods, Data Analysis and Quality Control, including a dedicated fisheries module. The "
            "programme covers data quality control, statistical analysis, visualisation, open-source "
            "software and handling fisheries datasets using tools such as R. Such skills are "
            "particularly valuable for converting large amounts of ocean and fisheries observations "
            "into reliable information for research, stock assessment and management.</p>"
            "<h3>💡 Why it matters</h3>"
            "<p>📊 Strong data skills turn ocean and fisheries observations into reliable information "
            "for research, stock assessment and management.</p>"
        ),
    },
]


class Command(BaseCommand):
    help = "Seed the latest ocean news events into the community events list (idempotent)."

    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model

        user = get_user_model().objects.filter(is_superuser=True).first()
        if user is None:
            user = get_user_model().objects.order_by("created_at").first()
        if user is None:
            self.stderr.write("No user found - create a user first.")
            return

        for item in NEWS_EVENTS:
            defaults = {
                "description": item["description"],
                "event_type": item["event_type"],
                "location": item["point"],
                "location_name": item["location_name"],
                "start_date": item["start_date"],
                "end_date": item["end_date"],
                "max_participants": item["max_participants"],
                "is_published": True,
                "organizer": user,
            }
            obj, created = Event.objects.update_or_create(
                title=item["title"], defaults=defaults
            )
            action = "created" if created else "updated"
            self.stdout.write(f"{action}: {obj.title}")

        self.stdout.write(self.style.SUCCESS(f"Done. {len(NEWS_EVENTS)} news events synced."))
