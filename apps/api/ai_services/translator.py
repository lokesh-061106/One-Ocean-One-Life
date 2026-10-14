import os
import logging

logger = logging.getLogger(__name__)

GOOGLE_TRANSLATE_API_KEY = os.environ.get('GOOGLE_TRANSLATE_API_KEY', '')


class Translator:
    _model = None

    TAMIL_ENGLISH_DICT = {
        'மீன்': 'fish', 'கடல்': 'sea', 'கரை': 'shore', 'அலை': 'wave',
        'மரம்': 'tree', 'வானம்': 'sky', 'சூரியன்': 'sun', 'நிலவு': 'moon',
        'பறவை': 'bird', 'ஆமை': 'turtle', 'சுறா': 'shark',
        'டால்பின்': 'dolphin', 'திமிங்கலம்': 'whale',
        'பவழம்': 'coral', 'சதுப்பு': 'mangrove',
        'மீனவர்': 'fisherman', 'கிராமம்': 'village',
        'மாவட்டம்': 'district', 'பகுதி': 'zone',
        'காற்று': 'wind', 'மழை': 'rain', 'புயல்': 'storm',
        'அமைதி': 'calm', 'கடுமை': 'rough',
        'உணவு': 'food', 'பயணம்': 'travel',
        'ஓய்வு': 'rest', 'விளையாட்டு': 'play',
        'இனப்பெருக்கம்': 'breeding', 'காண': 'see',
        'பார்த்தேன்': 'saw', 'சென்றன': 'went',
        'இரண்டு': 'two', 'மூன்று': 'three', 'நான்கு': 'four',
        'ஐந்து': 'five', 'ஒன்று': 'one',
    }

    @classmethod
    def translate_google(cls, text: str, source: str, target: str) -> dict:
        if not GOOGLE_TRANSLATE_API_KEY:
            return cls._fallback_translate(text, source, target)

        try:
            import requests
            url = f'https://translation.googleapis.com/language/translate/v2?key={GOOGLE_TRANSLATE_API_KEY}'
            payload = {
                'q': text,
                'source': source,
                'target': target,
                'format': 'text',
            }
            response = requests.post(url, data=payload, timeout=10)
            result = response.json()

            if 'data' in result and 'translations' in result['data']:
                translated = result['data']['translations'][0]['translatedText']
                return {
                    'translated_text': translated,
                    'source': source,
                    'target': target,
                    'engine': 'google_translate',
                    'confidence': 0.9,
                }
        except Exception as e:
            logger.error(f'Google Translate error: {e}')

        return cls._fallback_translate(text, source, target)

    @classmethod
    def _fallback_translate(cls, text: str, source: str, target: str) -> dict:
        if source == 'ta' and target == 'en':
            words = text.split()
            translated = []
            for word in words:
                if word in cls.TAMIL_ENGLISH_DICT:
                    translated.append(cls.TAMIL_ENGLISH_DICT[word])
                else:
                    translated.append(word)
            return {
                'translated_text': ' '.join(translated),
                'source': source,
                'target': target,
                'engine': 'dictionary_fallback',
                'confidence': 0.4,
                'note': 'Dictionary-based translation. Configure Google Translate API for better results.',
            }

        return {
            'translated_text': text,
            'source': source,
            'target': target,
            'engine': 'passthrough',
            'confidence': 0.0,
            'note': f'No translation engine available for {source} → {target}',
        }

    @classmethod
    def translate(cls, text: str, source: str = 'ta', target: str = 'en') -> dict:
        if GOOGLE_TRANSLATE_API_KEY:
            return cls.translate_google(text, source, target)
        return cls._fallback_translate(text, source, target)
