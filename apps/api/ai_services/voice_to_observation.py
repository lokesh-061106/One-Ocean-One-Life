import os
import time
import re
import logging

logger = logging.getLogger(__name__)

GOOGLE_SPEECH_API_KEY = os.environ.get('GOOGLE_SPEECH_API_KEY', '')
WHISPER_MODEL_SIZE = os.environ.get('WHISPER_MODEL_SIZE', 'base')

TAMIL_SPECIES_KEYWORDS = {
    'dolphin': ['டால்பின்', 'dolphin', 'சுழல்'],
    'whale': ['திமிங்கலம்', 'whale', 'திமிங்கல'],
    'turtle': ['ஆமை', 'turtle'],
    'shark': ['சுறா', 'shark'],
    'ray': ['ரே', 'ray', 'மான்டா'],
    'fish': ['மீன்', 'fish', 'நெத்திலி', 'கானாநெத்திலி', 'வாவல்'],
    'coral': ['பவழம்', 'coral'],
    'mangrove': ['சதுப்பு', 'mangrove'],
    'bird': ['பறவை', 'bird', 'புறா', 'seagull'],
    'dugong': ['கடல்பசு', 'dugong'],
}

TAMIL_BEHAVIOR_KEYWORDS = {
    'feeding': ['உணவு', 'feeding', 'சாப்பிட'],
    'traveling': ['பயணம்', 'traveling', 'செல்ல'],
    'resting': ['ஓய்வு', 'resting', 'ஓய்வெடு'],
    'playing': ['விளையாட்டு', 'playing'],
    'breeding': ['இனப்பெருக்கம்', 'breeding'],
}

TAMIL_SEA_CONDITIONS = {
    'calm': ['அமைதி', 'calm', 'அடக்க'],
    'rough': ['கடுமை', 'rough', 'காற்று'],
    'choppy': ['அலை', 'choppy'],
    'stormy': ['புயல்', 'stormy', 'மழை'],
}


class VoiceToObservation:
    _whisper_model = None

    @classmethod
    def _get_whisper(cls):
        if cls._whisper_model is not None:
            return cls._whisper_model

        try:
            import whisper
            cls._whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
            logger.info(f'Whisper model ({WHISPER_MODEL_SIZE}) loaded')
        except ImportError:
            logger.warning('Whisper not available')
            cls._whisper_model = None

        return cls._whisper_model

    @classmethod
    def transcribe_google(cls, audio_path: str, language: str = 'ta') -> dict:
        start = time.time()

        if not GOOGLE_SPEECH_API_KEY:
            return cls._mock_transcription(audio_path, language, start, 'google_mock')

        try:
            import requests
            with open(audio_path, 'rb') as f:
                audio_data = f.read()

            url = f'https://speech.googleapis.com/v1/speech:recognize?key={GOOGLE_SPEECH_API_KEY}'
            payload = {
                'config': {
                    'encoding': 'OGG_OPUS',
                    'sampleRateHertz': 48000,
                    'languageCode': f'{language}-IN',
                    'alternativeLanguageCodes': ['en-IN'],
                    'enableAutomaticPunctuation': True,
                },
                'audio': {
                    'content': audio_data.hex(),
                },
            }

            response = requests.post(url, json=payload, timeout=30)
            result = response.json()

            if 'results' in result and result['results']:
                transcript = result['results'][0]['alternatives'][0]['transcript']
                confidence = result['results'][0]['alternatives'][0].get('confidence', 0.5)
                elapsed = int((time.time() - start) * 1000)
                return {
                    'transcript': transcript,
                    'confidence': confidence,
                    'processing_time_ms': elapsed,
                    'engine': 'google_speech',
                }
        except Exception as e:
            logger.error(f'Google Speech API error: {e}')

        return cls._mock_transcription(audio_path, language, start, 'google_fallback')

    @classmethod
    def transcribe_whisper(cls, audio_path: str, language: str = 'ta') -> dict:
        start = time.time()

        model = cls._get_whisper()
        if not model:
            return cls._mock_transcription(audio_path, language, start, 'whisper_mock')

        try:
            result = model.transcribe(audio_path, language=language)
            elapsed = int((time.time() - start) * 1000)
            return {
                'transcript': result['text'],
                'confidence': 0.7,
                'processing_time_ms': elapsed,
                'engine': f'whisper_{WHISPER_MODEL_SIZE}',
            }
        except Exception as e:
            logger.error(f'Whisper transcription error: {e}')
            return cls._mock_transcription(audio_path, language, start, 'whisper_fallback')

    @classmethod
    def transcribe(cls, audio_path: str, language: str = 'ta', engine: str = 'auto') -> dict:
        if engine == 'google' or (engine == 'auto' and GOOGLE_SPEECH_API_KEY):
            return cls.transcribe_google(audio_path, language)
        elif engine == 'whisper' or engine == 'auto':
            return cls.transcribe_whisper(audio_path, language)
        return cls._mock_transcription(audio_path, language, time.time(), 'auto_fallback')

    @classmethod
    def parse_observation(cls, text: str, language: str = 'ta') -> dict:
        text_lower = text.lower()

        species = None
        for species_key, keywords in TAMIL_SPECIES_KEYWORDS.items():
            for kw in keywords:
                if kw.lower() in text_lower:
                    species = species_key
                    break
            if species:
                break

        behavior = None
        for behavior_key, keywords in TAMIL_BEHAVIOR_KEYWORDS.items():
            for kw in keywords:
                if kw.lower() in text_lower:
                    behavior = behavior_key
                    break
            if behavior:
                break

        sea_condition = None
        for condition_key, keywords in TAMIL_SEA_CONDITIONS.items():
            for kw in keywords:
                if kw.lower() in text_lower:
                    sea_condition = condition_key
                    break
            if sea_condition:
                break

        number = None
        number_match = re.search(r'(\d+)\s*(மீன்|fish|dolphin|whale|turtle|ஆமை|டால்பின்|திமிங்கலம்|சுறா)', text_lower)
        if number_match:
            number = int(number_match.group(1))
        else:
            tamil_numbers = {'ஒன்று': 1, 'இரண்டு': 2, 'மூன்று': 3, 'நான்கு': 4, 'ஐந்து': 5,
                           'ஆறு': 6, 'ஏழு': 7, 'எட்டு': 8, 'ஒன்பது': 9, 'பத்து': 10}
            for word, num in tamil_numbers.items():
                if word in text_lower:
                    number = num
                    break

        return {
            'species': species,
            'behavior': behavior,
            'sea_condition': sea_condition,
            'number_observed': number,
            'original_text': text,
            'parsed_fields': ['species', 'behavior', 'sea_condition', 'number_observed'],
        }

    @classmethod
    def process(cls, audio_path: str, language: str = 'ta', engine: str = 'auto') -> dict:
        transcription = cls.transcribe(audio_path, language, engine)
        parsed = cls.parse_observation(transcription['transcript'], language)

        return {
            'transcription': transcription,
            'parsed_observation': parsed,
        }

    @classmethod
    def _mock_transcription(cls, audio_path, language, start, engine):
        elapsed = int((time.time() - start) * 1000)
        mock_texts = {
            'ta': 'நான் கடலில் மூன்று டால்பின்களை பார்த்தேன். அவை வடக்கு நோக்கி சென்றன.',
            'en': 'I saw three dolphins in the sea. They were heading north.',
        }
        return {
            'transcript': mock_texts.get(language, mock_texts['en']),
            'confidence': 0.6,
            'processing_time_ms': elapsed,
            'engine': engine,
            'note': 'Using mock transcription. Configure API keys for production.',
        }
