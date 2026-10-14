"""API tests for the revamped contribution submission wizard."""

import io
import json

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from PIL import Image
from rest_framework.test import APIClient

from accounts.models import Profile, User
from contributions.models import Contribution, ContributionMedia, PendingContribution
from ocean_sounds.models import SoundCategory, SoundItem


def png_file(name='photo.png', color=(10, 120, 200)):
    buf = io.BytesIO()
    Image.new('RGB', (4, 4), color).save(buf, format='PNG')
    return SimpleUploadedFile(name, buf.getvalue(), content_type='image/png')


def wav_file(name='recording.wav'):
    return SimpleUploadedFile(
        name, b'RIFF\x24\x00\x00\x00WAVEfmt ', content_type='audio/wav',
    )


def mp4_file(name='clip.mp4'):
    return SimpleUploadedFile(
        name, b'\x00\x00\x00\x18ftypmp42', content_type='video/mp4',
    )


class ContributionWizardAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='fisher1', password='pass')
        self.profile = Profile.objects.create(user=self.user, contributor_type='fisher')
        self.client.force_authenticate(user=self.user)
        self.create_url = reverse('contribution_create')
        self.config_url = reverse('contribution_wizard_config')
        self.category = SoundCategory.objects.create(name='Whales', slug='whales')

    # ------------------------------------------------------------------ #
    # Wizard configuration
    # ------------------------------------------------------------------ #
    def test_wizard_config_lists_all_types_and_identities(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get(self.config_url)
        self.assertEqual(resp.status_code, 200)

        data = resp.json()
        types = {t['value'] for t in data['types']}
        self.assertIn('ocean_sound', types)
        self.assertIn('marine_sighting', types)
        self.assertIn('fish_catch', types)
        self.assertIn('event', types)
        self.assertEqual(len(data['contributor_types']), 6)
        self.assertEqual(
            [c['value'] for c in data['contributor_types']],
            ['fisher', 'researcher', 'volunteer', 'enthusiast', 'student', 'organisation'],
        )

        sound = next(t for t in data['types'] if t['value'] == 'ocean_sound')
        self.assertTrue(sound['requires_geotag'])
        self.assertEqual(
            [m['field'] for m in sound['media']['required']], ['audio'],
        )
        instrument = next(f for f in sound['fields'] if f['key'] == 'instrument')
        self.assertEqual(len(instrument['choices']), 5)

        # SoundCategory rows are injected live as Category choices (slug values)
        category = next(f for f in sound['fields'] if f['key'] == 'sound_category')
        self.assertTrue(category['required'])
        self.assertIn({'value': 'whales', 'label': 'Whales'}, category['choices'])

        sighting = next(t for t in data['types'] if t['value'] == 'marine_sighting')
        self.assertEqual(
            [m['field'] for m in sighting['media']['any_of']], ['images', 'video'],
        )

    # ------------------------------------------------------------------ #
    # Ocean Sound
    # ------------------------------------------------------------------ #
    def test_sound_requires_gps(self):
        resp = self.client.post(
            self.create_url,
            {'type': 'ocean_sound', 'audio': wav_file()},
            format='multipart',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('latitude', resp.json())

    def test_sound_requires_audio(self):
        resp = self.client.post(
            self.create_url,
            {'type': 'ocean_sound', 'latitude': 12.9, 'longitude': 79.8},
            format='multipart',
        )
        self.assertEqual(resp.status_code, 400)

    def test_sound_create_success(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'ocean_sound',
                'title': 'Dawn chorus off Ennore',
                'latitude': 13.23,
                'longitude': 80.31,
                'audio': wav_file(),
                'metadata': json.dumps({
                    'sound_category': 'whales',
                    'instrument': 'hydrophone',
                    'instrument_model': 'SoundTrap ST600',
                    'sampling_rate': '48000 Hz',
                    'recording_environment': 'coastal',
                    'depth_m': 4.5,
                    'recording_method': 'fixed buoy',
                }),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        contribution = Contribution.objects.get(pk=resp.json()['id'])
        self.assertEqual(contribution.status, 'submitted')
        self.assertIsNotNone(contribution.location)
        self.assertEqual(contribution.location.x, 80.31)
        self.assertEqual(contribution.location.y, 13.23)
        # profile identity applied automatically
        self.assertEqual(contribution.contributor_type, 'fisher')
        audio = contribution.media.get(kind='audio')
        self.assertEqual(audio.role, 'primary_audio')
        self.assertEqual(contribution.evidence_type, 'Audio')
        self.assertEqual(contribution.metadata['depth_m'], 4.5)

    def test_sound_rejects_unknown_enum(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'ocean_sound',
                'latitude': 12.9,
                'longitude': 79.8,
                'audio': wav_file(),
                'metadata': json.dumps({'instrument': 'banana'}),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('metadata', resp.json())

    def test_gps_out_of_range_rejected(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'ocean_sound',
                'latitude': 100,
                'longitude': 79.8,
                'audio': wav_file(),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('latitude', resp.json())

    # ------------------------------------------------------------------ #
    # Marine Species Sighting
    # ------------------------------------------------------------------ #
    def test_sighting_requires_photo_or_video(self):
        resp = self.client.post(
            self.create_url,
            {'type': 'marine_sighting', 'latitude': 12.9, 'longitude': 79.8},
            format='multipart',
        )
        self.assertEqual(resp.status_code, 400)

    def test_sighting_create_success(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'marine_sighting',
                'notes': 'Pod of five near the harbour mouth',
                'latitude': 13.1,
                'longitude': 80.3,
                'images': [png_file('sighting1.png')],
                'metadata': json.dumps({
                    'species_level': 'known',
                    'species_name': 'Bottlenose Dolphin',
                    'individuals': 5,
                    'behaviour': 'feeding',
                    'sea_condition': 'calm',
                }),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        contribution = Contribution.objects.get(pk=resp.json()['id'])
        self.assertEqual(contribution.status, 'submitted')
        self.assertEqual(contribution.metadata['individuals'], 5)
        self.assertEqual(contribution.media.count(), 1)

    def test_sighting_unknown_species_routes_to_expert_review(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'marine_sighting',
                'latitude': 13.1,
                'longitude': 80.3,
                'images': [png_file()],
                'metadata': json.dumps({'species_level': 'unknown'}),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        contribution = Contribution.objects.get(pk=resp.json()['id'])
        self.assertEqual(contribution.status, 'scientific_review')
        self.assertTrue(contribution.metadata['needs_expert_id'])

    def test_sighting_known_species_requires_species_name(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'marine_sighting',
                'latitude': 13.1,
                'longitude': 80.3,
                'images': [png_file()],
                'metadata': json.dumps({'species_level': 'known'}),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 400)

    def test_sighting_approximate_species_requires_group(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'marine_sighting',
                'latitude': 13.1,
                'longitude': 80.3,
                'images': [png_file()],
                'metadata': json.dumps({'species_level': 'approximate'}),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 400)

    # ------------------------------------------------------------------ #
    # Fish Catch
    # ------------------------------------------------------------------ #
    def test_fish_catch_create_success(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'fish_catch',
                'notes': 'Morning catch off Kovalam',
                'latitude': 12.78,
                'longitude': 80.25,
                'images': [png_file('catch1.png')],
                'metadata': json.dumps({
                    'species_level': 'known',
                    'species_name': 'Indian mackerel',
                    'number': 40,
                    'weight': 18.5,
                    'weight_unit': 'kg',
                    'length': 32,
                    'length_unit': 'cm',
                    'gear': 'gillnet',
                    'depth_m': 12,
                }),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        contribution = Contribution.objects.get(pk=resp.json()['id'])
        self.assertEqual(contribution.type, 'fish_catch')
        self.assertEqual(contribution.metadata['gear'], 'gillnet')
        self.assertEqual(contribution.metadata['weight'], 18.5)

    def test_fish_catch_rejects_unknown_gear(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'fish_catch',
                'latitude': 12.78,
                'longitude': 80.25,
                'images': [png_file()],
                'metadata': json.dumps({'gear': 'lightsabre'}),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 400)

    def test_fish_catch_requires_photo(self):
        resp = self.client.post(
            self.create_url,
            {'type': 'fish_catch', 'latitude': 12.78, 'longitude': 80.25},
            format='multipart',
        )
        self.assertEqual(resp.status_code, 400)

    # ------------------------------------------------------------------ #
    # Drafts, contributor identity, media roles
    # ------------------------------------------------------------------ #
    def test_draft_skips_requirements_then_submits(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'fish_catch',
                'title': 'Work in progress',
                'images': [png_file()],
                'draft': 'true',
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        pk = resp.json()['id']
        draft = Contribution.objects.get(pk=pk)
        self.assertEqual(draft.status, 'draft')
        self.assertIsNone(draft.submitted_at)

        # submitting without GPS must fail
        resp = self.client.patch(
            reverse('contribution_update', args=[pk]),
            {'submit': True},
            format='json',
        )
        self.assertEqual(resp.status_code, 400)

        # submitting with GPS succeeds
        resp = self.client.patch(
            reverse('contribution_update', args=[pk]),
            {'submit': True, 'latitude': 12.7, 'longitude': 80.2},
            format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        draft.refresh_from_db()
        self.assertEqual(draft.status, 'submitted')
        self.assertIsNotNone(draft.location)
        self.assertIsNotNone(draft.submitted_at)

    def test_remember_contributor_type_updates_profile(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'observation',
                'notes': 'Just an observation',
                'contributor_type': 'researcher',
                'remember_contributor_type': 'true',
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.contributor_type, 'researcher')
        contribution = Contribution.objects.get(pk=resp.json()['id'])
        self.assertEqual(contribution.contributor_type, 'researcher')

    def test_profile_identity_used_when_not_supplied(self):
        resp = self.client.post(
            self.create_url,
            {'type': 'observation', 'notes': 'Identity fallback'},
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201)
        contribution = Contribution.objects.get(pk=resp.json()['id'])
        self.assertEqual(contribution.contributor_type, 'fisher')

    def test_media_roles_are_stored(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'ocean_sound',
                'latitude': 13.0,
                'longitude': 80.2,
                'audio': wav_file(),
                'location_photo': png_file('location.png'),
                'setup_images': [png_file('setup.png')],
                'species_images': [png_file('species.png')],
                'voice_note': wav_file('voice.wav'),
                'metadata': json.dumps({'sound_category': 'whales'}),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        contribution = Contribution.objects.get(pk=resp.json()['id'])
        roles = set(contribution.media.values_list('role', flat=True))
        self.assertEqual(
            roles,
            {'primary_audio', 'location_photo', 'setup_photo', 'species_photo', 'voice_note'},
        )

    def test_sound_category_rejects_unknown_slug(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'ocean_sound',
                'latitude': 13.0,
                'longitude': 80.2,
                'audio': wav_file(),
                'metadata': json.dumps({'sound_category': 'not-a-category'}),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('metadata', resp.json())

    def test_publish_creates_sound_item_library_entry(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'ocean_sound',
                'title': 'Humpback off Mahabalipuram',
                'description': 'Long moan at dawn',
                'latitude': 12.91,
                'longitude': 80.25,
                'audio': wav_file('humpback.wav'),
                'images': [png_file('sound_photo.png')],
                'metadata': json.dumps({
                    'sound_category': 'whales',
                    'source': 'Field survey 2026',
                    'document_name': 'Sheet 1',
                }),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        contribution = Contribution.objects.get(pk=resp.json()['id'])

        from contributions.publishing import publish_contribution
        publish_contribution(contribution)

        sound = contribution.sound_item
        self.assertIsInstance(sound, SoundItem)
        self.assertEqual(sound.category, self.category)
        self.assertEqual(sound.name, 'Humpback off Mahabalipuram')
        self.assertEqual(sound.slug, 'humpback-off-mahabalipuram')
        self.assertEqual(sound.source, 'Field survey 2026')
        self.assertEqual(sound.document_name, 'Sheet 1')
        self.assertEqual(sound.sort_order, 0)
        self.assertTrue(sound.audio_file)
        self.assertTrue(sound.photo_file)
        self.assertEqual(contribution.ocean_sound.contribution, contribution)

        # re-publish is idempotent — no duplicate library row
        publish_contribution(contribution)
        self.assertEqual(
            SoundItem.objects.filter(contribution=contribution).count(), 1,
        )

    def test_publish_sound_without_category_falls_back(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'ocean_sound',
                'title': 'Untitled hydrophone clip',
                'latitude': 12.91,
                'longitude': 80.25,
                'audio': wav_file('clip.wav'),
                'metadata': json.dumps({'sound_category': 'whales'}),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        contribution = Contribution.objects.get(pk=resp.json()['id'])
        self.category.delete()

        from contributions.publishing import publish_contribution
        publish_contribution(contribution)

        sound = contribution.sound_item
        self.assertIsNotNone(sound.category)
        self.assertEqual(sound.slug, 'untitled-hydrophone-clip')

    def test_video_satisfies_sighting_evidence(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'marine_sighting',
                'latitude': 13.1,
                'longitude': 80.3,
                'video': mp4_file(),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertEqual(ContributionMedia.objects.filter(kind='video').count(), 1)

    def test_metadata_preserves_unknown_keys(self):
        resp = self.client.post(
            self.create_url,
            {
                'type': 'ocean_sound',
                'latitude': 13.0,
                'longitude': 80.2,
                'audio': wav_file(),
                'metadata': json.dumps({
                    'sound_category': 'whales',
                    'instrument': 'hydrophone',
                    'legacy_field': 'keep me',
                }),
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        contribution = Contribution.objects.get(pk=resp.json()['id'])
        self.assertEqual(contribution.metadata['legacy_field'], 'keep me')

    def test_media_input_map_matches_schema_declaration(self):
        from contributions.schemas import MEDIA_INPUT_FIELDS
        from contributions.serializers import MEDIA_INPUT_MAP

        self.assertEqual(set(MEDIA_INPUT_MAP), set(MEDIA_INPUT_FIELDS))


class PendingReviewStatusFlipTest(TestCase):
    """Regression: flipping Status -> verified on the Pending Reviews change
    form must publish module children.

    PendingReviewAdmin used to have no save_model(), so saving the form with
    Status="verified" marked the row verified (verified_at NULL, visibility
    PRIVATE) without ever creating the OceanSound/SoundItem rows — the item
    never appeared in the SoundItem admin.
    """

    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username='root', email='root@example.com', password='pass',
        )
        self.contributor = User.objects.create_user(username='aswath', password='pass')
        self.category = SoundCategory.objects.create(name='Whales', slug='whales')
        self.contribution = Contribution.objects.create(
            user=self.contributor,
            title='Shark for test',
            type='ocean_sound',
            status='submitted',
            description='A short shark call recorded off the coast.',
            metadata={'sound_category': 'whales', 'source': 'Field recording'},
        )
        ContributionMedia.objects.create(
            contribution=self.contribution,
            kind='audio',
            role='primary_audio',
            file=wav_file('shark.wav'),
        )
        self.url = reverse(
            'admin:contributions_pendingcontribution_change', args=[self.contribution.pk],
        )
        self.client.force_login(self.admin_user)

    def _form_data(self, status):
        return {
            'user': str(self.contributor.pk),
            'title': 'Shark for test',
            'author': '',
            'type': 'ocean_sound',
            'status': status,
            'location': '',
            'village': '',
            'zone': '',
            'notes': '',
            'description': 'A short shark call recorded off the coast.',
            'safety_status': 'SAFE',
            'moderation_decision': 'PENDING',
            'rejection_reason': '',
            'media-TOTAL_FORMS': '0',
            'media-INITIAL_FORMS': '0',
            'media-MIN_NUM_FORMS': '0',
            'media-MAX_NUM_FORMS': '1000',
        }

    def test_status_flip_to_verified_publishes_children(self):
        resp = self.client.post(self.url, self._form_data('verified'))
        self.assertEqual(resp.status_code, 302, resp.content)

        self.contribution.refresh_from_db()
        self.assertEqual(self.contribution.status, 'verified')
        self.assertIsNotNone(self.contribution.verified_at)
        self.assertEqual(self.contribution.visibility_status, 'COMMUNITY_VISIBLE')
        self.assertTrue(hasattr(self.contribution, 'ocean_sound'))
        self.assertTrue(hasattr(self.contribution, 'sound_item'))
        self.assertEqual(self.contribution.sound_item.name, 'Shark for test')

    def test_status_flip_away_from_verified_unpublishes(self):
        # The Pending Review change form can't be POSTed for a verified row
        # (get_queryset filters to pending statuses, so Django 302s to
        # "doesn't exist"). Call save_model directly to cover the demote path.
        from django.contrib.admin.sites import AdminSite
        from django.contrib.messages.storage.cookie import CookieStorage
        from django.test import RequestFactory

        from contributions.admin import PendingReviewAdmin
        from contributions.publishing import publish_contribution

        self.contribution.status = 'verified'
        self.contribution.save()
        publish_contribution(self.contribution)
        self.assertTrue(hasattr(self.contribution, 'sound_item'))

        request = RequestFactory().post('/admin/contributions/pendingcontribution/')
        request.user = self.admin_user
        # CookieStorage only — the project's FallbackStorage needs session
        # middleware, which RequestFactory requests don't have.
        request._messages = CookieStorage(request)

        obj = PendingContribution.objects.get(pk=self.contribution.pk)
        obj.status = 'moderator_review'
        PendingReviewAdmin(PendingContribution, AdminSite()).save_model(
            request, obj, form=None, change=True,
        )

        self.contribution.refresh_from_db()
        self.assertEqual(self.contribution.status, 'moderator_review')
        self.assertEqual(self.contribution.visibility_status, 'PRIVATE')
        self.assertEqual(
            SoundItem.objects.filter(contribution=self.contribution).count(), 0,
        )
        self.assertFalse(hasattr(self.contribution, 'ocean_sound'))


class SoundItemAudioGuardTest(TestCase):
    """Legacy spreadsheet imports are type ocean_sound but carry no recording.
    They must never mint a blank row in the curated Sound Library."""

    def setUp(self):
        self.user = User.objects.create_user(username='legacy', password='pass')

    def test_no_audio_means_no_sound_item(self):
        from contributions.publishing import publish_contribution

        contribution = Contribution.objects.create(
            user=self.user,
            title='',
            type='ocean_sound',
            status='verified',
            metadata={},
        )
        ContributionMedia.objects.create(
            contribution=contribution,
            kind='image',
            role='general',
            file=png_file('only_a_photo.png'),
        )

        publish_contribution(contribution)

        self.assertEqual(SoundItem.objects.filter(contribution=contribution).count(), 0)
        self.assertFalse(hasattr(contribution, 'ocean_sound'))

    def test_audio_still_creates_sound_item(self):
        from contributions.publishing import publish_contribution

        contribution = Contribution.objects.create(
            user=self.user,
            title='Dolphin whistle',
            type='ocean_sound',
            status='verified',
            metadata={'sound_category': 'whales'},
        )
        ContributionMedia.objects.create(
            contribution=contribution,
            kind='audio',
            role='primary_audio',
            file=wav_file('whistle.wav'),
        )

        publish_contribution(contribution)

        self.assertEqual(SoundItem.objects.filter(contribution=contribution).count(), 1)

    def test_legacy_ocean_sound_with_no_media_rows_borrows_its_audio(self):
        """Imports written straight into OceanSound have no media rows at all.

        They must still reach the Sound Library, borrowing the child's audio
        and taking the name from notes when the title is blank.
        """
        from contributions.publishing import publish_contribution
        from ocean_sounds.models import OceanSound, SoundCategory

        SoundCategory.objects.create(name='Whales', slug='whales')
        contribution = Contribution.objects.create(
            user=self.user,
            title='',
            notes='Dawn chorus recording near Nagapattinam shore',
            type='ocean_sound',
            status='verified',
            metadata={},
        )
        OceanSound.objects.create(
            contribution=contribution,
            audio_file=wav_file('legacy.wav'),
            written_description='Dawn chorus recorded near Nagapattinam shore.',
        )
        self.assertEqual(contribution.media.count(), 0)

        publish_contribution(contribution)

        sound = contribution.sound_item
        self.assertEqual(sound.name, 'Dawn chorus recording near Nagapattinam shore')
        self.assertEqual(sound.slug, 'dawn-chorus-recording-near-nagapattinam-shore')
        self.assertTrue(sound.audio_file)
        self.assertEqual(
            sound.description, 'Dawn chorus recorded near Nagapattinam shore.',
        )


class BackfillChildDetectionTest(TestCase):
    """ocean_sound mirrors into TWO tables — a row with OceanSound but no
    SoundItem still needs a repair pass, not an 'already OK' skip."""

    def setUp(self):
        from contributions.management.commands.backfill_module_children import Command

        self.command = Command()
        self.user = User.objects.create_user(username='backfill', password='pass')

    def _contribution(self):
        return Contribution.objects.create(
            user=self.user,
            title='Clip',
            type='ocean_sound',
            status='verified',
        )

    def test_ocean_sound_without_sound_item_is_not_ready(self):
        from ocean_sounds.models import OceanSound

        c = self._contribution()
        OceanSound.objects.create(
            contribution=c, audio_file=wav_file('clip.wav'),
        )
        self.assertFalse(self.command._has_child(c))

    def test_ocean_sound_with_both_children_is_ready(self):
        from ocean_sounds.models import OceanSound, SoundCategory, SoundItem

        c = self._contribution()
        category = SoundCategory.objects.create(name='Fish', slug='fish')
        OceanSound.objects.create(
            contribution=c, audio_file=wav_file('clip.wav'),
        )
        SoundItem.objects.create(
            contribution=c, category=category, name='Clip', slug='clip',
        )
        self.assertTrue(self.command._has_child(c))

    def test_other_module_types_still_use_single_accessor(self):
        c = self._contribution()
        c.type = 'education_post'
        c.save()
        self.assertFalse(self.command._has_child(c))

