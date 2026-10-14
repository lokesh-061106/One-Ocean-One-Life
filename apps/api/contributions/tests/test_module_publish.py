"""Publish-path tests for the remaining contribution module types.

fish_catch, observation, event and beach_cleanup previously fell through
``create_child_records()`` and returned ``[]`` — approval marked the row
verified but nothing appeared in any public gallery. These tests pin the
mirroring, the withdraw teardown, the content gate and the public endpoints.
"""

import io

from django.contrib.gis.geos import Point
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image
from rest_framework.test import APIClient

from accounts.models import User
from catches.models import FishCatch
from community.models import Event
from contributions.models import Contribution
from contributions.publishing import create_child_records, _remove_child_records
from ecotourism.models import BeachCleanupEvent
from observations.models import Observation


def png_file(name='photo.png', color=(10, 120, 200)):
    buf = io.BytesIO()
    Image.new('RGB', (4, 4), color).save(buf, format='PNG')
    return SimpleUploadedFile(name, buf.getvalue(), content_type='image/png')


class ModulePublishTestBase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='poster', password='pass', email='p@x.io')

    def _contribution(self, ctype, title='A title', notes='Some notes', meta=None, with_photo=False):
        c = Contribution.objects.create(
            user=self.user,
            type=ctype,
            status='submitted',
            title=title,
            notes=notes,
            # Keep description empty when the caller passes no text, so the
            # content-gate tests are not accidentally satisfied by the helper.
            description=notes + ' (long form)' if notes else '',
            location=Point(79.8, 10.7),
            metadata=meta or {},
        )
        if with_photo:
            c.media.create(kind='image', role='general', file=png_file())
        return c


class FishCatchPublishTest(ModulePublishTestBase):
    def test_publish_creates_fish_catch_with_mapped_metadata(self):
        c = self._contribution('fish_catch', title='Morning haul', meta={
            'species_name': 'Nile tilapia', 'species_level': 'known', 'species_group': 'fish',
            'number': '3', 'weight': '2.5', 'weight_unit': 'kg',
            'length': '41', 'length_unit': 'cm', 'gear': 'gillnet',
            'depth_m': '6', 'fishing_location_name': 'Palk Bay sandbank',
        })

        kids = create_child_records(c)
        self.assertEqual([type(k).__name__ for k in kids], ['FishCatch'])

        fc = FishCatch.objects.get(contribution=c)
        self.assertEqual(fc.species_name, 'Nile tilapia')
        self.assertEqual(fc.species_level, 'known')
        self.assertEqual(fc.species_group, 'fish')
        self.assertEqual(fc.number, 3)
        self.assertEqual(fc.weight, 2.5)
        self.assertEqual(fc.weight_unit, 'kg')
        self.assertEqual(fc.length, 41.0)
        self.assertEqual(fc.gear, 'gillnet')
        self.assertEqual(fc.depth_m, 6.0)
        self.assertEqual(fc.fishing_location_name, 'Palk Bay sandbank')
        self.assertEqual(fc.display_name, 'Nile tilapia')

    def test_unknown_enums_are_coerced_not_rejected(self):
        c = self._contribution('fish_catch', meta={
            'species_level': 'definitely-unknown', 'species_group': 'nope',
            'gear': 'telepathy', 'gear_other': 'hand line', 'number': 'lots',
        })
        create_child_records(c)
        fc = FishCatch.objects.get(contribution=c)
        self.assertEqual(fc.species_level, '')
        self.assertEqual(fc.species_group, '')
        self.assertEqual(fc.gear, 'other')
        self.assertEqual(fc.number, 1)

    def test_publish_is_idempotent(self):
        c = self._contribution('fish_catch', meta={'species_name': 'Tuna'})
        first = create_child_records(c)
        second = create_child_records(c)
        self.assertEqual([type(k).__name__ for k in first], ['FishCatch'])
        self.assertEqual([type(k).__name__ for k in second], ['FishCatch'])
        self.assertEqual(FishCatch.objects.filter(contribution=c).count(), 1)

    def test_withdraw_removes_the_catch(self):
        c = self._contribution('fish_catch', meta={'species_name': 'Tuna'})
        create_child_records(c)
        _remove_child_records(c)
        self.assertFalse(FishCatch.objects.filter(contribution=c).exists())

    def test_photo_is_carried_over(self):
        c = self._contribution('fish_catch', meta={'species_name': 'Tuna'}, with_photo=True)
        create_child_records(c)
        self.assertTrue(FishCatch.objects.get(contribution=c).photo)


class ObservationPublishTest(ModulePublishTestBase):
    def test_publish_creates_observation(self):
        c = self._contribution('observation', title='Debris pile', meta={
            'observation_category': 'pollution', 'organism_name': 'Plastic near jetty',
        })
        kids = create_child_records(c)
        self.assertEqual([type(k).__name__ for k in kids], ['Observation'])

        ob = Observation.objects.get(contribution=c)
        self.assertEqual(ob.observation_category, 'pollution')
        self.assertEqual(ob.organism_name, 'Plastic near jetty')
        self.assertEqual(ob.display_name, 'Plastic near jetty')

    def test_blank_legacy_row_creates_nothing(self):
        c = self._contribution('observation', title='', notes='', meta={})
        self.assertEqual(create_child_records(c), [])
        self.assertFalse(Observation.objects.filter(contribution=c).exists())

    def test_photo_only_submission_still_publishes(self):
        c = self._contribution('observation', title='', notes='', with_photo=True)
        kids = create_child_records(c)
        self.assertEqual(len(kids), 1)
        ob = Observation.objects.get(contribution=c)
        self.assertTrue(ob.photo)

    def test_withdraw_removes_the_observation(self):
        c = self._contribution('observation', meta={'observation_category': 'habitat'})
        create_child_records(c)
        _remove_child_records(c)
        self.assertFalse(Observation.objects.filter(contribution=c).exists())


class EventPublishTest(ModulePublishTestBase):
    def test_publish_creates_a_published_event(self):
        c = self._contribution('event', title='Mangrove planting', meta={
            'event_date': '2026-11-02', 'venue': 'Nagapattinam hall',
            'expected_participants': '40',
        })
        kids = create_child_records(c)
        self.assertEqual([type(k).__name__ for k in kids], ['Event'])

        e = Event.objects.get(contribution=c)
        self.assertEqual(e.title, 'Mangrove planting')
        self.assertTrue(e.is_published)
        # 'event' has no type field in the wizard, so it defaults to a
        # generic community_meeting rather than a cleanup.
        self.assertEqual(e.event_type, 'community_meeting')
        self.assertEqual(e.organizer, self.user)
        self.assertEqual(e.location_name, 'Nagapattinam hall')
        self.assertEqual(e.max_participants, 40)
        self.assertIsNotNone(e.location)
        # A wizard date is local-only; assert against the local calendar day
        # rather than the UTC-stored one (TIME_ZONE is Asia/Kolkata).
        from django.utils import timezone

        local = e.start_date.astimezone(timezone.get_current_timezone())
        self.assertEqual(local.date().isoformat(), '2026-11-02')

    def test_missing_event_date_falls_back_to_submission_time(self):
        c = self._contribution('event', meta={})
        create_child_records(c)
        e = Event.objects.get(contribution=c)
        self.assertEqual(e.start_date.date(), c.created_at.date())

    def test_withdraw_removes_the_event(self):
        c = self._contribution('event', meta={'event_date': '2026-11-02'})
        create_child_records(c)
        _remove_child_records(c)
        self.assertFalse(Event.objects.filter(contribution=c).exists())


class BeachCleanupPublishTest(ModulePublishTestBase):
    def test_publish_creates_both_event_and_cleanup(self):
        c = self._contribution('beach_cleanup', title='Weekly cleanup', meta={
            'cleanup_date': '2026-11-05', 'participants_count': '25',
            'waste_weight_kg': '120.5', 'organising_body': 'Fishers coop',
            'waste_types': 'bottles, nets',
        })
        kids = create_child_records(c)
        # Both rows matter: analytics counts Event(type='cleanup'), the
        # storefront reads BeachCleanupEvent.
        self.assertEqual([type(k).__name__ for k in kids], ['Event', 'BeachCleanupEvent'])

        e = Event.objects.get(contribution=c)
        self.assertEqual(e.event_type, 'cleanup')
        self.assertTrue(e.is_published)

        b = BeachCleanupEvent.objects.get(contribution=c)
        self.assertIsNone(b.beach)
        self.assertEqual(b.event, e)
        self.assertEqual(b.cleanup_date.isoformat(), '2026-11-05')
        self.assertEqual(b.participants_count, 25)
        self.assertEqual(b.waste_collected_kg, 120.5)
        self.assertEqual(b.organized_by, self.user)
        self.assertIn('bottles, nets', b.description)

    def test_withdraw_removes_both_rows(self):
        c = self._contribution('beach_cleanup', meta={'cleanup_date': '2026-11-05'})
        create_child_records(c)
        _remove_child_records(c)
        self.assertFalse(BeachCleanupEvent.objects.filter(contribution=c).exists())
        self.assertFalse(Event.objects.filter(contribution=c).exists())

    def test_missing_cleanup_date_falls_back_to_submission_day(self):
        c = self._contribution('beach_cleanup', meta={})
        create_child_records(c)
        b = BeachCleanupEvent.objects.get(contribution=c)
        self.assertEqual(b.cleanup_date, c.created_at.date())


class ContentGateTest(ModulePublishTestBase):
    """education_post / local_knowledge are text-first; observation also
    accepts media. Blank spreadsheet imports must not mint gallery rows."""

    def test_blank_education_post_creates_nothing(self):
        c = self._contribution('education_post', title='', notes='')
        self.assertEqual(create_child_records(c), [])

    def test_blank_local_knowledge_creates_nothing(self):
        c = self._contribution('local_knowledge', title='', notes='')
        self.assertEqual(create_child_records(c), [])

    def test_text_education_post_still_publishes(self):
        c = self._contribution('education_post', title='Turtle nesting facts')
        kids = create_child_records(c)
        self.assertEqual(len(kids), 1)

    def test_text_local_knowledge_still_publishes(self):
        c = self._contribution('local_knowledge', title='How we read the monsoon')
        kids = create_child_records(c)
        self.assertEqual(len(kids), 1)


class BackfillRegistryTest(ModulePublishTestBase):
    def test_accessors_cover_every_module_type(self):
        from contributions.management.commands.backfill_module_children import ACCESSORS, MODULE_TYPES

        for ctype in ('marine_sighting', 'ocean_sound', 'education_post', 'local_knowledge',
                      'fish_catch', 'observation', 'event', 'beach_cleanup'):
            self.assertIn(ctype, MODULE_TYPES)
            self.assertIn(ctype, ACCESSORS)

    def test_beach_cleanup_needs_both_accessors(self):
        from contributions.management.commands.backfill_module_children import Command

        c = self._contribution('beach_cleanup', meta={'cleanup_date': '2026-11-05'})
        self.assertFalse(Command._has_child(c))

        Event.objects.create(
            title='T', description='d', event_type='cleanup',
            organizer=self.user, contribution=c, start_date=c.created_at,
        )
        self.assertFalse(Command._has_child(c), 'Event alone is not enough')

        BeachCleanupEvent.objects.create(
            beach=None, event=c.event, contribution=c, title='T', cleanup_date=c.created_at.date(),
        )
        self.assertTrue(Command._has_child(c))

    def test_module_destinations_cover_every_module_type(self):
        from contributions.models import PendingContribution

        expected = {
            'marine_sighting': 'Sightings', 'ocean_sound': 'Sounds',
            'education_post': 'Education', 'local_knowledge': 'Species Guides',
            'fish_catch': 'Fish Catch', 'observation': 'Observations',
            'event': 'Events', 'beach_cleanup': 'Cleanups',
        }
        for ctype, dest in expected.items():
            self.assertEqual(PendingContribution.MODULE_DESTINATIONS.get(ctype), dest, ctype)

    def test_backfill_skips_blank_rows_for_gated_types(self):
        from contributions.management.commands.backfill_module_children import (
            CONTENT_GATED_TYPES,
            _gated_out,
        )

        for ctype in ('local_knowledge', 'education_post', 'observation'):
            blank = self._contribution(ctype, title='', notes='')
            self.assertTrue(_gated_out(blank), ctype)

            filled = self._contribution(ctype, title='Something useful')
            self.assertFalse(_gated_out(filled), ctype)

        # observation also accepts a photo with no text
        photo_only = self._contribution('observation', title='', notes='', with_photo=True)
        self.assertFalse(_gated_out(photo_only))

        # _gated_out is content-only; the command only consults it for gated types
        self.assertTrue(_gated_out(self._contribution('fish_catch', title='', notes='')))
        self.assertNotIn('fish_catch', CONTENT_GATED_TYPES)
        self.assertNotIn('event', CONTENT_GATED_TYPES)
        self.assertNotIn('beach_cleanup', CONTENT_GATED_TYPES)
        self.assertNotIn('marine_sighting', CONTENT_GATED_TYPES)
        self.assertNotIn('ocean_sound', CONTENT_GATED_TYPES)


class PublicEndpointTest(ModulePublishTestBase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        # The public views filter contribution__status='verified', so publish
        # for real rather than only calling create_child_records().
        self.catch = self._publish('fish_catch', title='Nile tilapia catch', meta={
            'species_name': 'Nile tilapia', 'gear': 'gillnet',
        }, with_photo=True)
        self.obs = self._publish('observation', title='Debris field', meta={
            'observation_category': 'debris', 'organism_name': 'Ghost net',
        })
        self.cleanup = self._publish('beach_cleanup', title='Saturday cleanup', meta={
            'cleanup_date': '2026-11-05', 'participants_count': '12',
        })

    def _publish(self, ctype, **kwargs):
        c = self._contribution(ctype, **kwargs)
        create_child_records(c)
        c.status = 'verified'
        c.save()
        return c

    def test_catch_list_and_detail(self):
        resp = self.client.get('/api/v1/catches/')
        self.assertEqual(resp.status_code, 200)
        rows = resp.json()['results'] if 'results' in resp.json() else resp.json()
        slugs = {r['slug'] for r in rows}
        self.assertIn(FishCatch.objects.get(contribution=self.catch).slug, slugs)

        slug = FishCatch.objects.get(contribution=self.catch).slug
        resp = self.client.get('/api/v1/catches/%s/' % slug)
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body['species_name'], 'Nile tilapia')
        self.assertEqual(body['contributor'], 'poster')
        self.assertEqual(body['status'], 'verified')

    def test_observation_list_and_detail(self):
        resp = self.client.get('/api/v1/observations/')
        self.assertEqual(resp.status_code, 200)

        slug = Observation.objects.get(contribution=self.obs).slug
        resp = self.client.get('/api/v1/observations/%s/' % slug)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['organism_name'], 'Ghost net')

    def test_unverified_rows_do_not_leak(self):
        self.catch.status = 'submitted'
        self.catch.save()
        resp = self.client.get('/api/v1/catches/')
        rows = resp.json()['results'] if 'results' in resp.json() else resp.json()
        self.assertEqual(rows, [])

    def test_cleanup_detail_survives_a_null_beach(self):
        b = BeachCleanupEvent.objects.get(contribution=self.cleanup)
        self.assertIsNone(b.beach)
        resp = self.client.get('/api/v1/ecotourism/cleanups/%s/' % b.pk)
        self.assertEqual(resp.status_code, 200)
        self.assertIsNone(resp.json()['beach_name'])

    def test_cleanup_list_includes_contribution_rows(self):
        resp = self.client.get('/api/v1/ecotourism/cleanups/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        rows = data['results'] if isinstance(data, dict) and 'results' in data else data
        titles = {r['title'] for r in rows}
        self.assertIn('Saturday cleanup', titles)

    def test_contribution_event_is_listed(self):
        resp = self.client.get('/api/v1/community/events/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        rows = data['results'] if isinstance(data, dict) and 'results' in data else data
        titles = {r['title'] for r in rows}
        self.assertIn('Saturday cleanup', titles)

    def test_unpublished_event_detail_404s(self):
        e = Event.objects.create(
            title='Private meeting', description='internal', event_type='research',
            organizer=self.user, start_date='2026-12-01T00:00:00Z', is_published=False,
        )
        resp = self.client.get('/api/v1/community/events/%s/' % e.pk)
        self.assertEqual(resp.status_code, 404)
        resp = self.client.get('/api/v1/community/events/%s/' % e.slug)
        self.assertEqual(resp.status_code, 404)
