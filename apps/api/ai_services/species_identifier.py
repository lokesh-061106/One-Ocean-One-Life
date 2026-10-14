import os
import time
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

MODEL_DIR = Path(os.environ.get('AI_MODEL_DIR', 'models/'))
SPECIES_MODEL_PATH = MODEL_DIR / 'species_classifier.pth'


class SpeciesIdentifier:
    _model = None
    _labels = None
    _transform = None

    SPECIES_LABELS = [
        'spinner_dolphin', 'bottlenose_dolphin', 'humpback_dolphin',
        'blue_whale', 'fin_whale', 'minke_whale',
        'leatherback_turtle', 'hawksbill_turtle', 'green_turtle',
        'whale_shark', 'hammerhead_shark', 'tiger_shark',
        'manta_ray', 'eagle_ray',
        'dugong',
        'peacock_mantle_shrimp', 'giant_clam', 'brain_coral',
        'staghorn_coral', 'mangrove_crab',
        'seagull', 'pelican', 'cormorant',
        'seahorse', 'lionfish', 'pufferfish',
        'parrotfish', 'barracuda', 'tuna',
    ]

    COMMON_NAMES = {
        'spinner_dolphin': ('Spinner Dolphin', 'சுழல் டால்பின்'),
        'bottlenose_dolphin': ('Bottlenose Dolphin', 'மூக்கு டால்பின்'),
        'humpback_dolphin': ('Humpback Dolphin', 'கும்பம் டால்பின்'),
        'blue_whale': ('Blue Whale', 'நீல திமிங்கலம்'),
        'fin_whale': ('Fin Whale', 'தோல் திமிங்கலம்'),
        'minke_whale': ('Minke Whale', 'மின்கே திமிங்கலம்'),
        'leatherback_turtle': ('Leatherback Turtle', 'தோல் ஆமை'),
        'hawksbill_turtle': ('Hawksbill Turtle', ' ஆமை'),
        'green_turtle': ('Green Turtle', 'பச்சை ஆமை'),
        'whale_shark': ('Whale Shark', 'திமிங்கல சுறா'),
        'hammerhead_shark': ('Hammerhead Shark', 'சுத்தி சுறா'),
        'tiger_shark': ('Tiger Sh ark', 'புலி சுறா'),
        'manta_ray': ('Manta Ray', 'மான்டா ரே'),
        'eagle_ray': ('Eagle Ray', 'கழுகு ரே'),
        'dugong': ('Dugong', 'கடல்பசு'),
        'seagull': ('Seagull', 'கடல் புறா'),
        'pelican': ('Pelican', 'பெலிகன்'),
        'cormorant': ('Cormorant', 'கோர்மரண்ட்'),
        'coral': ('Coral', 'பவழம்'),
        'mangrove': ('Mangrove', 'சதுப்பு நிலம்'),
        'seagrass': ('Seagrass', 'கடல் புற்கள்'),
    }

    @classmethod
    def _load_model(cls):
        if cls._model is not None:
            return

        try:
            import torch
            import torchvision.models as models
            import torchvision.transforms as transforms
            from PIL import Image

            cls._model = models.mobilenet_v3_small(pretrained=True)
            num_ftrs = cls._model.classifier[3].in_features
            cls._model.classifier[3] = torch.nn.Linear(num_ftrs, len(cls.SPECIES_LABELS))
            cls._model.eval()

            cls._transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ])

            if SPECIES_MODEL_PATH.exists():
                state_dict = torch.load(SPECIES_MODEL_PATH, map_location='cpu')
                cls._model.load_state_dict(state_dict, strict=False)
                logger.info('Loaded custom species model weights')

            logger.info('Species identification model loaded successfully')
        except ImportError:
            logger.warning('PyTorch not available. Using mock species identification.')
            cls._model = 'mock'

    @classmethod
    def identify(cls, image_path: str) -> dict:
        start_time = time.time()

        cls._load_model()

        if cls._model == 'mock':
            return cls._mock_identify(image_path, start_time)

        try:
            import torch
            from PIL import Image

            image = Image.open(image_path).convert('RGB')
            input_tensor = cls._transform(image).unsqueeze(0)

            with torch.no_grad():
                outputs = cls._model(input_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)
                top5_prob, top5_idx = torch.topk(probabilities, 5)

            predictions = []
            for i in range(5):
                idx = top5_idx[0][i].item()
                prob = top5_prob[0][i].item()
                label = cls.SPECIES_LABELS[idx] if idx < len(cls.SPECIES_LABELS) else f'unknown_{idx}'
                common, tamil = cls.COMMON_NAMES.get(label, (label.replace('_', ' ').title(), ''))
                predictions.append({
                    'species': label,
                    'common_name': common,
                    'tamil_name': tamil,
                    'confidence': round(prob, 4),
                })

            top = predictions[0]
            elapsed_ms = int((time.time() - start_time) * 1000)

            return {
                'species': top['common_name'],
                'scientific_name': top['species'].replace('_', ' ').title(),
                'tamil_name': top['tamil_name'],
                'confidence': top['confidence'],
                'confidence_level': 'high' if top['confidence'] > 0.8 else 'medium' if top['confidence'] > 0.5 else 'low',
                'all_predictions': predictions,
                'processing_time_ms': elapsed_ms,
            }
        except Exception as e:
            logger.error(f'Species identification failed: {e}')
            return cls._mock_identify(image_path, start_time)

    @classmethod
    def _mock_identify(cls, image_path, start_time):
        import random
        species = random.choice(list(cls.COMMON_NAMES.keys()))
        common, tamil = cls.COMMON_NAMES[species]
        confidence = random.uniform(0.4, 0.95)
        elapsed_ms = int((time.time() - start_time) * 1000)

        return {
            'species': common,
            'scientific_name': species.replace('_', ' ').title(),
            'tamil_name': tamil,
            'confidence': round(confidence, 4),
            'confidence_level': 'high' if confidence > 0.8 else 'medium' if confidence > 0.5 else 'low',
            'all_predictions': [{
                'species': species,
                'common_name': common,
                'tamil_name': tamil,
                'confidence': round(confidence, 4),
            }],
            'processing_time_ms': elapsed_ms,
            'note': 'Using mock identification. Train custom model for production.',
        }
