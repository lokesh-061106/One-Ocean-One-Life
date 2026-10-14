from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from . import services
from .models import Booking, ExperiencePackage, SplitRule, TourismOpportunity
from locations.models import Village

User = get_user_model()


class SplitComputationTests(TestCase):
    def test_default_split_matches_transparency_spec(self):
        lines = services.compute_split(3000, 'fisher_coastal')
        amounts = {ln['recipient_type']: ln['amount'] for ln in lines}
        self.assertEqual(amounts['provider'], Decimal('2400.00'))
        self.assertEqual(amounts['village'], Decimal('300.00'))
        self.assertEqual(amounts['platform'], Decimal('150.00'))
        self.assertEqual(amounts['conservation'], Decimal('150.00'))

    def test_lines_always_sum_to_total(self):
        for total in (4999, 300, 99.5, 12345.67, 7):
            lines = services.compute_split(total, 'default')
            s = sum(ln['amount'] for ln in lines)
            self.assertEqual(s, Decimal(str(total)).quantize(Decimal('0.01')))

    def test_configurable_rule_is_used(self):
        SplitRule.objects.create(
            name='custom', scope='ocean_learning', is_active=True,
            provider_pct=70, village_pct=15, platform_pct=10, conservation_pct=5,
        )
        lines = services.compute_split(1000, 'ocean_learning')
        amounts = {ln['recipient_type']: ln['amount'] for ln in lines}
        self.assertEqual(amounts['provider'], Decimal('700.00'))
        self.assertEqual(amounts['village'], Decimal('150.00'))


class LeanWindowTests(TestCase):
    def setUp(self):
        from locations.models import StateFisheriesProfile, StateLeanPeriod
        self.profile, _ = StateFisheriesProfile.objects.get_or_create(
            state='Tamil Nadu',
            defaults=dict(slug='tamil-nadu', latitude=10.3, longitude=79.9),
        )
        StateLeanPeriod.objects.get_or_create(
            profile=self.profile,
            region_label='Northern & central/eastern coast',
            defaults=dict(
                district='', typical_period='October–March, varying by district',
                start_month=10, start_day=1, end_month=3, end_day=31, order=0,
            ),
        )

    def test_tn_monsoon_window_active_in_october(self):
        windows = services.active_lean_windows(state='Tamil Nadu', on_date=date(2026, 10, 10))
        self.assertTrue(any(w['district'] == '' for w in windows))

    def test_tn_window_inactive_in_september(self):
        windows = services.active_lean_windows(state='Tamil Nadu', on_date=date(2026, 9, 10))
        self.assertFalse(any(w['district'] == '' for w in windows))

    def test_wrap_window_oct_to_mar(self):
        self.assertTrue(services._is_date_in_window(date(2026, 12, 1), 10, 1, 3, 31))
        self.assertTrue(services._is_date_in_window(date(2026, 1, 15), 10, 1, 3, 31))
        self.assertFalse(services._is_date_in_window(date(2026, 5, 1), 10, 1, 3, 31))


class BookingFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tourist = User.objects.create_user(
            username='tourist1', password='pass1234', role='GUEST',
            email='t@example.com',
        )
        self.other = User.objects.create_user(
            username='other1', password='pass1234', role='GUEST',
        )
        village = Village.objects.select_related('district').filter(is_coastal=True).first()
        self.experience = TourismOpportunity.objects.create(
            name='Test Boat Trip', opportunity_type='boat_tour',
            model_category='fisher_coastal', description='A test trip',
            village=village, price_min=Decimal('2000'), price_max=Decimal('4000'),
            price_unit='person', max_participants=8, is_offshore=False,
            is_active=True,
        )

    def _create_booking(self):
        self.client.force_authenticate(user=self.tourist)
        resp = self.client.post('/api/v1/ecotourism/bookings/', {
            'experience': str(self.experience.id),
            'experience_date': (timezone.localdate() + timedelta(days=3)).isoformat(),
            'participants': 2,
            'contact_name': 'Test Tourist',
            'contact_phone': '9999999999',
        }, format='json')
        return resp

    def test_booking_created_with_split_preview(self):
        resp = self._create_booking()
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(Decimal(str(resp.data['total_amount'])), Decimal('4000.00'))
        self.assertIn('split_preview', resp.data)
        preview = {ln['recipient_type']: Decimal(str(ln['amount'])) for ln in resp.data['split_preview']}
        self.assertEqual(preview['provider'], Decimal('3200.00'))

    def test_demo_payment_creates_payout_ledger(self):
        resp = self._create_booking()
        booking_id = resp.data['id']

        pay = self.client.post(f'/api/v1/ecotourism/bookings/{booking_id}/pay/')
        self.assertEqual(pay.status_code, 200, pay.data)
        self.assertEqual(pay.data['mode'], 'demo')

        ver = self.client.post(f'/api/v1/ecotourism/bookings/{booking_id}/verify/', {
            'razorpay_payment_id': 'pay_demo_123',
            'razorpay_order_id': pay.data['order_id'],
            'razorpay_signature': 'demo',
        }, format='json')
        self.assertEqual(ver.status_code, 200, ver.data)

        booking = Booking.objects.get(pk=booking_id)
        self.assertEqual(booking.payment_status, 'paid')
        self.assertEqual(booking.status, 'confirmed')
        self.assertEqual(booking.payouts.count(), 4)
        total = sum(p.amount for p in booking.payouts.all())
        self.assertEqual(total, booking.total_amount)

        ledger = self.client.get(f'/api/v1/ecotourism/bookings/{booking_id}/ledger/')
        self.assertEqual(ledger.status_code, 200)
        self.assertFalse(ledger.data['preview'])
        self.assertEqual(len(ledger.data['payouts']), 4)

    def test_booking_requires_auth(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post('/api/v1/ecotourism/bookings/', {}, format='json')
        self.assertIn(resp.status_code, (401, 403))

    def test_participants_limit_enforced(self):
        self.client.force_authenticate(user=self.tourist)
        resp = self.client.post('/api/v1/ecotourism/bookings/', {
            'experience': str(self.experience.id),
            'experience_date': (timezone.localdate() + timedelta(days=3)).isoformat(),
            'participants': 50,
        }, format='json')
        self.assertEqual(resp.status_code, 400)


class OwnershipPermissionTests(TestCase):
    """Regression: listings must not be editable by arbitrary authenticated users."""

    def setUp(self):
        self.client = APIClient()
        village = Village.objects.select_related('district').filter(is_coastal=True).first()
        self.owner = User.objects.create_user(username='owner1', password='pass1234', role='TOURISM_PROVIDER')
        self.intruder = User.objects.create_user(username='intruder1', password='pass1234', role='GUEST')
        self.experience = TourismOpportunity.objects.create(
            name='Owner Trip', opportunity_type='boat_tour',
            model_category='fisher_coastal', description='x',
            village=village, price_min=Decimal('1000'), provider=self.owner,
            is_active=True,
        )

    def test_intruder_cannot_update(self):
        self.client.force_authenticate(user=self.intruder)
        resp = self.client.put(
            f'/api/v1/ecotourism/experiences/{self.experience.id}/update/',
            {'name': 'Hacked', 'opportunity_type': 'boat_tour',
             'model_category': 'fisher_coastal', 'description': 'x'},
            format='json',
        )
        self.assertEqual(resp.status_code, 404)
        self.experience.refresh_from_db()
        self.assertEqual(self.experience.name, 'Owner Trip')

    def test_intruder_cannot_delete(self):
        self.client.force_authenticate(user=self.intruder)
        resp = self.client.delete(f'/api/v1/ecotourism/experiences/{self.experience.id}/delete/')
        self.assertEqual(resp.status_code, 404)
        self.assertTrue(TourismOpportunity.objects.filter(pk=self.experience.pk).exists())

    def test_owner_can_update(self):
        self.client.force_authenticate(user=self.owner)
        resp = self.client.put(
            f'/api/v1/ecotourism/experiences/{self.experience.id}/update/',
            {'name': 'Owner Trip v2', 'opportunity_type': 'boat_tour',
             'model_category': 'fisher_coastal', 'description': 'x'},
            format='json',
        )
        self.assertEqual(resp.status_code, 200)
        self.experience.refresh_from_db()
        self.assertEqual(self.experience.name, 'Owner Trip v2')


class PublicEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_models_taxonomy(self):
        resp = self.client.get('/api/v1/ecotourism/models/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 5)
        keys = [m['key'] for m in resp.data]
        self.assertEqual(
            keys,
            ['fisher_coastal', 'nature_tours', 'homestay_food', 'ocean_learning', 'festival_market'],
        )

    def test_experiences_list_filter_by_category(self):
        resp = self.client.get('/api/v1/ecotourism/experiences/?model_category=ocean_learning')
        self.assertEqual(resp.status_code, 200)
        for item in resp.data['results']:
            self.assertEqual(item['model_category'], 'ocean_learning')

    def test_lean_season_endpoint(self):
        resp = self.client.get('/api/v1/ecotourism/lean-season/?state=Tamil Nadu')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('active', resp.data)
        self.assertIn('windows', resp.data)
        self.assertIn('experiences', resp.data)

    def test_split_rules_public(self):
        resp = self.client.get('/api/v1/ecotourism/split-rules/')
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_split_preview_calculator(self):
        resp = self.client.post('/api/v1/ecotourism/split-preview/', {'amount': 3000})
        self.assertEqual(resp.status_code, 200)
        amounts = {ln['recipient_type']: Decimal(str(ln['amount'])) for ln in resp.data['lines']}
        self.assertEqual(amounts['provider'], Decimal('2400.00'))

    def test_map_points(self):
        resp = self.client.get('/api/v1/ecotourism/map-points/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('points', resp.data)

    def test_legacy_endpoints_still_work(self):
        for path in ('beaches/', 'opportunities/', 'cleanups/', 'businesses/'):
            resp = self.client.get(f'/api/v1/ecotourism/{path}')
            self.assertEqual(resp.status_code, 200, path)


class ReviewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='reviewer1', password='pass1234')
        village = Village.objects.select_related('district').filter(is_coastal=True).first()
        self.experience = TourismOpportunity.objects.create(
            name='Reviewable Trip', opportunity_type='boat_tour',
            model_category='fisher_coastal', description='x', village=village,
            price_min=Decimal('1000'), is_active=True,
        )

    def test_review_updates_listing_rating(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.post('/api/v1/ecotourism/reviews/', {
            'experience': str(self.experience.id),
            'rating': 5,
            'title': 'Great',
            'comment': 'Loved it',
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.data)
        self.experience.refresh_from_db()
        self.assertEqual(self.experience.rating, 5.0)
        self.assertEqual(self.experience.total_reviews, 1)

    def test_duplicate_review_rejected(self):
        self.client.force_authenticate(user=self.user)
        payload = {'experience': str(self.experience.id), 'rating': 4, 'title': 'ok', 'comment': 'x'}
        self.client.post('/api/v1/ecotourism/reviews/', payload, format='json')
        resp = self.client.post('/api/v1/ecotourism/reviews/', payload, format='json')
        self.assertEqual(resp.status_code, 400)
