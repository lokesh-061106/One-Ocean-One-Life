from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from contributions.models import Contribution

from sightings.models import MarineSighting
from sightings.views import MarineSightingListView


class MarineSightingOrderingTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        user = get_user_model().objects.create_user(username='orderer', password='x')
        base = timezone.now() - timedelta(days=30)
        for i in range(5):
            contribution = Contribution.objects.create(
                user=user,
                type='marine_sighting',
                status='verified',
                title=f'Ordering fixture {i}',
            )
            sighting = MarineSighting.objects.create(contribution=contribution)
            # auto_now_add ignores explicit values, so pin them after the fact
            # to guarantee a strictly increasing sequence.
            MarineSighting.objects.filter(pk=sighting.pk).update(
                created_at=base + timedelta(minutes=i)
            )

    def test_list_returns_oldest_first(self):
        resp = MarineSightingListView.as_view()(APIRequestFactory().get('/api/v1/sightings/'))
        resp.render()
        results = resp.data['results'] if isinstance(resp.data, dict) else resp.data

        slugs = [r['slug'] for r in results]
        created = [r['created_at'] for r in results]

        self.assertEqual(len(results), MarineSighting.objects.count())
        self.assertEqual(created, sorted(created), msg=f'not ascending: {slugs}')

        oldest = MarineSighting.objects.order_by('created_at', 'pk').first()
        self.assertEqual(slugs[0], oldest.slug)

    def test_list_view_ordering_is_ascending(self):
        """The list view overrides the model's newest-first Meta ordering."""
        self.assertEqual(list(MarineSighting._meta.ordering), ['-created_at'])
        self.assertEqual(MarineSightingListView.ordering, ['created_at'])
