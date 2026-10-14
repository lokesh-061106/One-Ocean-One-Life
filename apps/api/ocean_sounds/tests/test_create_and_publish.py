"""Mobile /sounds/create/ → contribution → SoundItem library publish."""

import io
import json

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from PIL import Image
from rest_framework.test import APIClient

from accounts.models import Profile, User
from contributions.publishing import publish_contribution
from ocean_sounds.models import OceanSound, SoundCategory, SoundItem


def png_file(name='photo.png', color=(10, 120, 200)):
    buf = io.BytesIO()
    Image.new('RGB', (4, 4), color).save(buf, format='PNG')
    return SimpleUploadedFile(name, buf.getvalue(), content_type='image/png')


def wav_file(name='recording.wav'):
    return SimpleUploadedFile(
        name, b'RIFF\x24\x00\x00\x00WAVEfmt ', content_type='audio/wav',
    )


def pdf_file(name='sheet.pdf'):
    return SimpleUploadedFile(
        name, b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n%%EOF\n',
        content_type='application/pdf',
    )


class OceanSoundCreateAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='recorder1', password='pass')
        Profile.objects.create(user=self.user, contributor_type='fisher')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('ocean_sound_create')
        self.category = SoundCategory.objects.create(name='Whales', slug='whales')

    def test_create_with_admin_fields_then_publish(self):
        resp = self.client.post(
            self.url,
            {
                'audio_file': wav_file('dawn.wav'),
                'name': 'Dawn chorus off Ennore',
                'category': 'whales',
                'slug': 'Dawn Chorus!',
                'sort_order': '5',
                'source': 'Field survey 2026',
                'description': 'Long moan at dawn',
                'document_name': 'Sheet 1',
                'photo_file': png_file('sound_photo.png'),
                'spectrogram_file': png_file('spectrogram.png', color=(200, 30, 30)),
                'document': pdf_file(),
                'instrument': 'Hydrophone',
                'latitude': '13.23',
                'longitude': '80.31',
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        ocean_sound = OceanSound.objects.get(pk=json.loads(resp.content)['id'])
        contribution = ocean_sound.contribution

        # Contribution carries the SoundItem fields for publish time.
        self.assertEqual(contribution.title, 'Dawn chorus off Ennore')
        self.assertIn('Long moan at dawn', contribution.description)
        meta = contribution.metadata
        self.assertEqual(meta['sound_category'], 'whales')
        self.assertEqual(meta['slug'], 'Dawn Chorus!')
        self.assertEqual(meta['sort_order'], 5)
        self.assertEqual(meta['source'], 'Field survey 2026')
        self.assertEqual(meta['document_name'], 'Sheet 1')
        self.assertEqual(contribution.status, 'submitted')
        self.assertIsNotNone(contribution.location)

        # Media rows use wizard roles.
        roles = set(contribution.media.values_list('role', flat=True))
        self.assertEqual(
            roles, {'primary_audio', 'general', 'spectrogram', 'document'},
        )

        # Research fields still land on the OceanSound row.
        self.assertEqual(ocean_sound.instrument, 'Hydrophone')
        self.assertTrue(ocean_sound.audio_file)

        publish_contribution(contribution)
        sound = contribution.sound_item
        self.assertIsInstance(sound, SoundItem)
        self.assertEqual(sound.category, self.category)
        self.assertEqual(sound.name, 'Dawn chorus off Ennore')
        self.assertEqual(sound.slug, 'dawn-chorus')  # slugified + trimmed
        self.assertEqual(sound.sort_order, 5)
        self.assertEqual(sound.source, 'Field survey 2026')
        self.assertEqual(sound.document_name, 'Sheet 1')
        self.assertIn('Long moan at dawn', sound.description)
        self.assertTrue(sound.audio_file)
        self.assertTrue(sound.photo_file)
        self.assertTrue(sound.spectrogram_file)
        self.assertTrue(sound.document)

        publish_contribution(contribution)
        self.assertEqual(
            SoundItem.objects.filter(contribution=contribution).count(), 1,
        )

    def test_create_without_library_fields_still_works(self):
        resp = self.client.post(
            self.url,
            {'audio_file': wav_file(), 'instrument': 'Standard Recorder'},
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        ocean_sound = OceanSound.objects.get(pk=json.loads(resp.content)['id'])
        contribution = ocean_sound.contribution
        self.assertEqual(contribution.title, 'Ocean sound')
        self.assertEqual(contribution.metadata['sound_category'], '')
        self.assertEqual(contribution.metadata['sort_order'], 0)
        self.assertEqual(
            set(contribution.media.values_list('role', flat=True)),
            {'primary_audio'},
        )

        publish_contribution(contribution)
        sound = contribution.sound_item
        self.assertEqual(sound.category, self.category)  # fallback: first root
        self.assertEqual(sound.slug, 'ocean-sound')

    def test_unknown_category_rejected(self):
        resp = self.client.post(
            self.url,
            {'audio_file': wav_file(), 'category': 'not-a-category'},
            format='multipart',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('category', resp.json())

    def test_duplicate_slug_gets_suffix(self):
        first = self.client.post(
            self.url,
            {'audio_file': wav_file(), 'name': 'One', 'category': 'whales'},
            format='multipart',
        )
        self.assertEqual(first.status_code, 201, first.content)
        publish_contribution(
            OceanSound.objects.get(pk=json.loads(first.content)['id']).contribution,
        )

        second = self.client.post(
            self.url,
            {
                'audio_file': wav_file('two.wav'),
                'name': 'Two',
                'category': 'whales',
                'slug': 'one',  # collides with the published "one"
            },
            format='multipart',
        )
        self.assertEqual(second.status_code, 201, second.content)
        contribution = OceanSound.objects.get(
            pk=json.loads(second.content)['id'],
        ).contribution
        publish_contribution(contribution)
        self.assertEqual(contribution.sound_item.slug, 'one-2')


class WizardConfigSoundItemFieldsTest(TestCase):
    def test_ocean_sound_exposes_admin_fields(self):
        from contributions.schemas import build_wizard_config

        config = build_wizard_config()
        sound = next(t for t in config['types'] if t['value'] == 'ocean_sound')
        keys = [f['key'] for f in sound['fields']]
        self.assertEqual(
            keys[:5],
            ['sound_category', 'slug', 'sort_order', 'source', 'document_name'],
        )
        slug = sound['fields'][1]
        self.assertFalse(slug.get('required'))
        sort_order = sound['fields'][2]
        self.assertEqual(sort_order['type'], 'integer')
        self.assertEqual(sort_order['min'], 0)
        self.assertEqual(
            sound['text_fields'],
            [{'key': 'description', 'label': 'Description', 'required': False}],
        )
