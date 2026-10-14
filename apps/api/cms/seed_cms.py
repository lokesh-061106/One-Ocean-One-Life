import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'o3l.settings.development')
django.setup()

from cms.models import Page, PageSection, PageFAQ, ContactInfo


def seed_cms():
    if Page.objects.filter(slug='about').exists():
        print("CMS pages already seeded. Skipping.")
        return

    # ==================== ABOUT PAGE ====================
    about = Page.objects.create(
        slug='about',
        title='About O3L',
        meta_description='One Ocean One Life - A platform connecting fishing communities with marine conservation.',
        hero_title='One Ocean, One Life',
        hero_subtitle='Building a global movement to protect our oceans through community-driven conservation, shared knowledge, and sustainable livelihoods.',
        content=(
            '<p>O3L (One Ocean, One Life) is a community-driven marine conservation platform that connects '
            'fishing villages, researchers, educators, and ocean lovers across Tamil Nadu and beyond.</p>'
            '<p>We believe that the health of our oceans is inseparable from the wellbeing of coastal communities. '
            'By combining traditional knowledge with modern technology, we create a living bridge between generations and cultures.</p>'
            '<p>Our platform empowers every community member to contribute to ocean conservation through observations, '
            'recordings, and shared experiences - building the world\'s most comprehensive community-sourced marine database.</p>'
        ),
        sidebar_content=(
            '<p><strong>Our Vision</strong></p>'
            '<p>A world where coastal communities thrive alongside healthy, biodiverse oceans.</p>'
            '<p><strong>Our Mission</strong></p>'
            '<p>To connect, educate, and empower coastal communities through technology for ocean conservation.</p>'
        ),
        is_published=True,
        sort_order=1,
    )
    PageSection.objects.create(page=about, title='Our Mission', icon='Target',
        content='<p>O3L empowers fishing communities to become active stewards of marine resources through technology, education, and collective action.</p>', sort_order=1)
    PageSection.objects.create(page=about, title='Our Values', icon='Heart',
        content='<p>Community First - Ocean Conservation - Inclusivity - Sustainability - Citizen Science - Impact-Driven</p>', sort_order=2)
    PageSection.objects.create(page=about, title='Our Journey', icon='Map',
        content='<p>From a small pilot in Nagapattinam to a movement spanning all 5 coastal zones of Tamil Nadu, O3L has grown to over 142,000 active community members.</p>', sort_order=3)
    print('  Created About page')

    # ==================== PRIVACY PAGE ====================
    privacy = Page.objects.create(
        slug='privacy',
        title='Privacy Policy',
        meta_description='Privacy Policy for O3L - How we collect, use, and protect your personal information.',
        hero_title='Privacy Policy',
        hero_subtitle='Your privacy is fundamental to our mission. Learn how we protect your data.',
        content='<p>At O3L (One Ocean, One Life), we are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.</p>',
        is_published=True,
        sort_order=2,
    )
    PageSection.objects.create(page=privacy, title='Information We Collect', icon='Database',
        content='<p>Account information (name, email, phone), profile details, contributions (observations, recordings, posts), device information, location data (with consent), and usage preferences.</p>', sort_order=1)
    PageSection.objects.create(page=privacy, title='How We Use Your Information', icon='Eye',
        content='<p>To provide platform services, process contributions, connect you with other members, send notifications, analyze platform usage, and ensure community safety.</p>', sort_order=2)
    PageSection.objects.create(page=privacy, title='Information Sharing', icon='Users',
        content='<p>Your public profile is visible to other members. We share aggregated, anonymized data for research. We never sell your personal information.</p>', sort_order=3)
    PageSection.objects.create(page=privacy, title='Data Security', icon='Lock',
        content='<p>We use industry-standard encryption, hashed passwords, regular security audits, optional two-factor authentication, and encrypted backups.</p>', sort_order=4)
    PageSection.objects.create(page=privacy, title='Your Rights', icon='Globe',
        content='<p>You can access and download your data, correct inaccuracies, delete your account, opt out of non-essential data collection, and withdraw consent at any time.</p>', sort_order=5)
    PageSection.objects.create(page=privacy, title='Data Retention', icon='Shield',
        content='<p>Active account data is retained while your account is active. Contribution data may be retained for research. Inactive data is purged after 90 days.</p>', sort_order=6)
    print('  Created Privacy page')

    # ==================== TERMS PAGE ====================
    terms = Page.objects.create(
        slug='terms',
        title='Terms of Service',
        meta_description='Terms of Service for O3L - Rules and guidelines for using our platform.',
        hero_title='Terms of Service',
        hero_subtitle='Please read these terms carefully before using the O3L platform.',
        content='<p>By accessing or using O3L (One Ocean, One Life), you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>',
        is_published=True,
        sort_order=3,
    )
    PageSection.objects.create(page=terms, title='Acceptance of Terms', icon='FileText',
        content='<p>By creating an account or using O3L, you agree to these terms and our Privacy Policy. We may update these terms periodically.</p>', sort_order=1)
    PageSection.objects.create(page=terms, title='User Accounts', icon='Users',
        content='<p>You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your credentials.</p>', sort_order=2)
    PageSection.objects.create(page=terms, title='User Conduct', icon='Shield',
        content='<p>You agree not to: impersonate others, post harmful or false content, harass other users, or attempt to access others accounts.</p>', sort_order=3)
    PageSection.objects.create(page=terms, title='Content and Contributions', icon='FileText',
        content='<p>You retain ownership of your content. By posting, you grant O3L a non-exclusive license to use your contributions for research and education.</p>', sort_order=4)
    PageSection.objects.create(page=terms, title='Disclaimer', icon='AlertTriangle',
        content='<p>O3L is provided as is without warranties. We do not guarantee uninterrupted service or accuracy of content.</p>', sort_order=5)
    PageSection.objects.create(page=terms, title='Limitation of Liability', icon='Scale',
        content='<p>O3L and its affiliates shall not be liable for indirect, incidental, special, or consequential damages.</p>', sort_order=6)
    PageSection.objects.create(page=terms, title='Governing Law', icon='Globe',
        content='<p>These terms are governed by the laws of India. Disputes are subject to courts in Chennai, Tamil Nadu.</p>', sort_order=7)
    print('  Created Terms page')

    # ==================== CONTACT PAGE ====================
    contact = Page.objects.create(
        slug='contact',
        title='Contact Us',
        meta_description='Get in touch with the O3L team.',
        hero_title='Contact Us',
        hero_subtitle='Have questions? We would love to hear from you.',
        content='<p>Whether you have a question about features, pricing, need a demo, or anything else - our team is ready to answer all your questions.</p>',
        is_published=True,
        sort_order=4,
    )
    ContactInfo.objects.create(
        page=contact,
        email_main='contact@o3l.org',
        email_support='support@o3l.org',
        phone_main='+91-44-12345678',
        phone_secondary='+91-9876543210',
        address='Marine Research Center, 2nd Floor, Near Fishing Harbor, Chennai, Tamil Nadu 600001',
        working_hours='Mon - Fri: 9:00 AM - 6:00 PM',
        map_lat=13.0827,
        map_lng=80.2707,
    )
    # Add FAQs for contact page
    PageFAQ.objects.create(page=contact, question='How do I join O3L?', answer='Simply click the Register button and fill in your details. It is free and takes less than 2 minutes.', sort_order=1)
    PageFAQ.objects.create(page=contact, question='Is O3L free to use?', answer='Yes! O3L is completely free for all community members. Our mission is to make marine conservation accessible to everyone.', sort_order=2)
    PageFAQ.objects.create(page=contact, question='How do I report a marine sighting?', answer='Use the Sightings section on the platform to log your observation. Include photos if possible - our AI will help identify the species.', sort_order=3)
    PageFAQ.objects.create(page=contact, question='Can I use O3L on my mobile phone?', answer='Yes, O3L is designed to work on any device with a web browser. A dedicated mobile app is coming soon.', sort_order=4)
    PageFAQ.objects.create(page=contact, question='How can I contribute ocean sounds?', answer='Navigate to the Sounds section and use the recording feature. You can also upload pre-recorded audio files with metadata.', sort_order=5)
    print('  Created Contact page')

    print(f'\nTotal pages: {Page.objects.count()}')
    print(f'Total sections: {PageSection.objects.count()}')
    print(f'Total FAQs: {PageFAQ.objects.count()}')


if __name__ == '__main__':
    seed_cms()
