from django.core.management.base import BaseCommand
from cms.models import Page, PageSection, PageFAQ, ContactInfo


class Command(BaseCommand):
    help = "Seed CMS pages (About, Privacy, Terms, Contact)"

    def handle(self, *args, **options):
        if Page.objects.filter(slug="about").exists():
            self.stdout.write("CMS pages already seeded. Skipping.")
            return

        self._seed_about()
        self._seed_privacy()
        self._seed_terms()
        self._seed_contact()
        self.stdout.write(self.style.SUCCESS(f"Seeded {Page.objects.count()} pages, {PageSection.objects.count()} sections, {PageFAQ.objects.count()} FAQs"))

    def _seed_about(self):
        about = Page.objects.create(
            slug="about", title="About O3L",
            meta_description="One Ocean One Life - A platform connecting fishing communities with marine conservation.",
            hero_title="One Ocean, One Life",
            hero_subtitle="Building a global movement to protect our oceans through community-driven conservation, shared knowledge, and sustainable livelihoods.",
            content="<p>O3L (One Ocean, One Life) is a community-driven marine conservation platform that connects fishing villages, researchers, educators, and ocean lovers across Tamil Nadu and beyond.</p><p>We believe that the health of our oceans is inseparable from the wellbeing of coastal communities. By combining traditional knowledge with modern technology, we create a living bridge between generations and cultures.</p><p>Our platform empowers every community member to contribute to ocean conservation through observations, recordings, and shared experiences.</p>",
            sidebar_content="<p><strong>Our Vision</strong></p><p>A world where coastal communities thrive alongside healthy, biodiverse oceans.</p><p><strong>Our Mission</strong></p><p>To connect, educate, and empower coastal communities through technology for ocean conservation.</p>",
            is_published=True, sort_order=1,
        )
        PageSection.objects.create(page=about, title="Our Mission", icon="Target", content="<p>O3L empowers fishing communities to become active stewards of marine resources through technology, education, and collective action.</p>", sort_order=1)
        PageSection.objects.create(page=about, title="Our Values", icon="Heart", content="<p>Community First, Ocean Conservation, Inclusivity, Sustainability, Citizen Science, Impact-Driven</p>", sort_order=2)
        PageSection.objects.create(page=about, title="Our Journey", icon="Map", content="<p>From a small pilot in Nagapattinam to a movement spanning all 5 coastal zones of Tamil Nadu, O3L has grown to over 142,000 active community members.</p>", sort_order=3)
        self.stdout.write("  Created About page")

    def _seed_privacy(self):
        p = Page.objects.create(
            slug="privacy", title="Privacy Policy",
            meta_description="Privacy Policy for O3L - How we collect, use, and protect your personal information.",
            hero_title="Privacy Policy", hero_subtitle="Your privacy is fundamental to our mission.",
            content="<p>At O3L, we are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, and safeguard your information.</p>",
            is_published=True, sort_order=2,
        )
        PageSection.objects.create(page=p, title="Information We Collect", icon="Database", content="<p>Account information, profile details, contributions, device information, location data (with consent), and usage preferences.</p>", sort_order=1)
        PageSection.objects.create(page=p, title="How We Use Your Information", icon="Eye", content="<p>To provide platform services, process contributions, connect you with other members, send notifications, and ensure community safety.</p>", sort_order=2)
        PageSection.objects.create(page=p, title="Information Sharing", icon="Users", content="<p>Your public profile is visible to other members. We share aggregated data for research. We never sell your information.</p>", sort_order=3)
        PageSection.objects.create(page=p, title="Data Security", icon="Lock", content="<p>Industry-standard encryption, hashed passwords, regular security audits, and encrypted backups.</p>", sort_order=4)
        PageSection.objects.create(page=p, title="Your Rights", icon="Globe", content="<p>Access, download, correct, delete your data. Opt out of non-essential collection. Withdraw consent anytime.</p>", sort_order=5)
        PageSection.objects.create(page=p, title="Data Retention", icon="Shield", content="<p>Active data retained while account is active. Inactive data purged after 90 days. Analytics retained 12 months.</p>", sort_order=6)
        self.stdout.write("  Created Privacy page")

    def _seed_terms(self):
        p = Page.objects.create(
            slug="terms", title="Terms of Service",
            meta_description="Terms of Service for O3L.",
            hero_title="Terms of Service", hero_subtitle="Please read these terms carefully before using O3L.",
            content="<p>By accessing O3L, you agree to be bound by these Terms of Service.</p>",
            is_published=True, sort_order=3,
        )
        PageSection.objects.create(page=p, title="Acceptance of Terms", icon="FileText", content="<p>By creating an account or using O3L, you agree to these terms and our Privacy Policy.</p>", sort_order=1)
        PageSection.objects.create(page=p, title="User Accounts", icon="Users", content="<p>You must be at least 13 years old. You are responsible for your credentials. One person, one account.</p>", sort_order=2)
        PageSection.objects.create(page=p, title="User Conduct", icon="Shield", content="<p>No impersonation, harmful content, harassment, unauthorized access, or illegal use.</p>", sort_order=3)
        PageSection.objects.create(page=p, title="Content and Contributions", icon="FileText", content="<p>You own your content. You grant O3L a non-exclusive license for research and education.</p>", sort_order=4)
        PageSection.objects.create(page=p, title="Disclaimer", icon="AlertTriangle", content="<p>O3L is provided as is without warranties. No guarantee of uninterrupted service.</p>", sort_order=5)
        PageSection.objects.create(page=p, title="Limitation of Liability", icon="Scale", content="<p>No liability for indirect, incidental, or consequential damages.</p>", sort_order=6)
        PageSection.objects.create(page=p, title="Governing Law", icon="Globe", content="<p>Governed by laws of India. Courts in Chennai, Tamil Nadu have jurisdiction.</p>", sort_order=7)
        self.stdout.write("  Created Terms page")

    def _seed_contact(self):
        p = Page.objects.create(
            slug="contact", title="Contact Us",
            meta_description="Get in touch with the O3L team.",
            hero_title="Contact Us", hero_subtitle="Have questions? We would love to hear from you.",
            content="<p>Whether you have a question about features, pricing, or anything else - our team is ready to answer.</p>",
            is_published=True, sort_order=4,
        )
        ContactInfo.objects.create(
            page=p, email_main="contact@o3l.org", email_support="support@o3l.org",
            phone_main="+91-44-12345678", phone_secondary="+91-9876543210",
            address="Marine Research Center, 2nd Floor, Near Fishing Harbor, Chennai 600001",
            working_hours="Mon - Fri: 9:00 AM - 6:00 PM", map_lat=13.0827, map_lng=80.2707,
        )
        PageFAQ.objects.create(page=p, question="How do I join O3L?", answer="Click Register and fill in your details. It is free and takes less than 2 minutes.", sort_order=1)
        PageFAQ.objects.create(page=p, question="Is O3L free?", answer="Yes! O3L is completely free for all community members.", sort_order=2)
        PageFAQ.objects.create(page=p, question="How do I report a sighting?", answer="Use the Sightings section. Include photos - our AI will help identify the species.", sort_order=3)
        PageFAQ.objects.create(page=p, question="Can I use it on mobile?", answer="Yes, O3L works on any device with a web browser.", sort_order=4)
        PageFAQ.objects.create(page=p, question="How do I contribute ocean sounds?", answer="Navigate to Sounds and use the recording feature or upload pre-recorded audio.", sort_order=5)
        self.stdout.write("  Created Contact page")
