import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


class DataQualityScorer:
    MINIMUM_FIELDS_FOR_SUBMISSION = ['type', 'notes']
    RECOMMENDED_FIELDS = {
        'ocean_sound': ['instrument', 'recording_date', 'written_description'],
        'marine_sighting': ['species', 'number_observed', 'behavior', 'sighting_date'],
        'education_post': ['title', 'content', 'category'],
        'observation': ['notes'],
        'beach_cleanup': ['notes'],
    }

    SPECIES_LOCATION_VALID = {
        'dolphin': {'min_lat': 8.0, 'max_lat': 13.5, 'min_lng': 76.5, 'max_lng': 80.5},
        'whale': {'min_lat': 8.0, 'max_lat': 13.5, 'min_lng': 76.5, 'max_lng': 80.5},
        'turtle': {'min_lat': 8.0, 'max_lat': 13.5, 'min_lng': 76.5, 'max_lng': 80.5},
        'dugong': {'min_lat': 8.5, 'max_lat': 9.5, 'min_lng': 77.5, 'max_lng': 79.5},
    }

    @classmethod
    def score_contribution(cls, contribution) -> dict:
        issues = []
        suggestions = []
        completeness = 0
        accuracy = 0
        consistency = 0

        completeness = cls._score_completeness(contribution, issues, suggestions)
        accuracy = cls._score_accuracy(contribution, issues, suggestions)
        consistency = cls._score_consistency(contribution, issues, suggestions)

        overall = (completeness * 0.4 + accuracy * 0.35 + consistency * 0.25)

        return {
            'completeness_score': round(completeness, 3),
            'accuracy_score': round(accuracy, 3),
            'consistency_score': round(consistency, 3),
            'overall_score': round(overall, 3),
            'issues': issues,
            'suggestions': suggestions,
            'is_auto_validated': overall >= 0.8 and len(issues) == 0,
        }

    @classmethod
    def _score_completeness(cls, contribution, issues, suggestions):
        required_fields = cls.MINIMUM_FIELDS_FOR_SUBMISSION
        recommended = cls.RECOMMENDED_FIELDS.get(contribution.type, [])

        filled_required = 0
        for field in required_fields:
            value = getattr(contribution, field, None) or contribution.metadata.get(field)
            if value:
                filled_required += 1
            else:
                issues.append({
                    'type': 'missing_required',
                    'field': field,
                    'message': f'Required field "{field}" is missing.',
                })

        filled_recommended = 0
        for field in recommended:
            value = getattr(contribution, field, None) or contribution.metadata.get(field)
            if value:
                filled_recommended += 1
            else:
                suggestions.append({
                    'type': 'missing_recommended',
                    'field': field,
                    'message': f'Adding "{field}" would improve data quality.',
                })

        required_score = filled_required / len(required_fields) if required_fields else 1
        recommended_score = filled_recommended / len(recommended) if recommended else 1

        return required_score * 0.6 + recommended_score * 0.4

    @classmethod
    def _score_accuracy(cls, contribution, issues, suggestions):
        score = 1.0

        if contribution.location:
            lat = contribution.location.y
            lng = contribution.location.x

            if lat < 8.0 or lat > 13.5 or lng < 76.5 or lng > 80.5:
                issues.append({
                    'type': 'location_out_of_bounds',
                    'message': f'Location ({lat}, {lng}) is outside Tamil Nadu coastal area.',
                })
                score -= 0.3

        if contribution.type == 'marine_sighting':
            sighting = getattr(contribution, 'marine_sighting', None)
            if sighting and sighting.species:
                species_key = sighting.species.common_name.lower().split()[0]
                bounds = cls.SPECIES_LOCATION_VALID.get(species_key)
                if bounds and contribution.location:
                    lat = contribution.location.y
                    lng = contribution.location.x
                    if not (bounds['min_lat'] <= lat <= bounds['max_lat'] and
                            bounds['min_lng'] <= lng <= bounds['max_lng']):
                        suggestions.append({
                            'type': 'unusual_location',
                            'message': f'This species is rarely seen at this location.',
                        })
                        score -= 0.1

            if sighting and sighting.number_observed:
                if sighting.number_observed > 100:
                    issues.append({
                        'type': 'unusual_count',
                        'message': f'Observation count ({sighting.number_observed}) seems unusually high.',
                    })
                    score -= 0.2

        if not contribution.notes and not contribution.metadata:
            suggestions.append({
                'type': 'no_description',
                'message': 'Adding notes or metadata improves data quality.',
            })
            score -= 0.1

        return max(0, score)

    @classmethod
    def _score_consistency(cls, contribution, issues, suggestions):
        score = 1.0

        if contribution.submitted_at and contribution.created_at:
            if contribution.submitted_at < contribution.created_at:
                issues.append({
                    'type': 'timeline_inconsistency',
                    'message': 'Submission date is before creation date.',
                })
                score -= 0.3

        if contribution.verified_at and contribution.submitted_at:
            if contribution.verified_at < contribution.submitted_at:
                issues.append({
                    'type': 'timeline_inconsistency',
                    'message': 'Verification date is before submission date.',
                })
                score -= 0.3

        if contribution.quality_score > 0 and contribution.status == 'draft':
            suggestions.append({
                'type': 'status_mismatch',
                'message': 'Quality score is set but contribution is still in draft.',
            })
            score -= 0.1

        return max(0, score)
