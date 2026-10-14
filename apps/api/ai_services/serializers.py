from rest_framework import serializers
from .models_main import SpeciesIdentification, VoiceObservation, TranslationLog, DataQualityReport


class SpeciesIdentificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpeciesIdentification
        fields = [
            'id', 'image', 'user', 'suggested_species', 'scientific_name',
            'confidence', 'confidence_level', 'all_predictions',
            'is_human_verified', 'verified_species', 'processing_time_ms', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at']


class SpeciesIdentificationResultSerializer(serializers.Serializer):
    species = serializers.CharField()
    scientific_name = serializers.CharField()
    tamil_name = serializers.CharField()
    confidence = serializers.FloatField()
    confidence_level = serializers.CharField()
    all_predictions = serializers.ListField()
    processing_time_ms = serializers.IntegerField()
    note = serializers.CharField(required=False)


class VoiceObservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceObservation
        fields = [
            'id', 'audio_file', 'user', 'language', 'transcribed_text',
            'parsed_data', 'confidence', 'processing_time_ms', 'engine_used', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at']


class VoiceObservationResultSerializer(serializers.Serializer):
    transcription = serializers.DictField()
    parsed_observation = serializers.DictField()


class TranslationSerializer(serializers.Serializer):
    text = serializers.CharField()
    source_language = serializers.CharField(default='ta')
    target_language = serializers.CharField(default='en')


class TranslationResultSerializer(serializers.Serializer):
    translated_text = serializers.CharField()
    source = serializers.CharField()
    target = serializers.CharField()
    engine = serializers.CharField()
    confidence = serializers.FloatField()
    note = serializers.CharField(required=False)


class SemanticSearchSerializer(serializers.Serializer):
    query = serializers.CharField()
    type = serializers.ChoiceField(choices=['all', 'species', 'education'], default='all')
    top_k = serializers.IntegerField(default=10, min_value=1, max_value=50)


class DataQualityReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataQualityReport
        fields = [
            'id', 'contribution', 'completeness_score', 'accuracy_score',
            'consistency_score', 'overall_score', 'issues', 'suggestions',
            'is_auto_validated', 'created_at',
        ]
