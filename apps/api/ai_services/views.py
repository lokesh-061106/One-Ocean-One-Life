import tempfile
import os
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models_main import SpeciesIdentification, VoiceObservation, TranslationLog, DataQualityReport
from .serializers import (
    SpeciesIdentificationSerializer, SpeciesIdentificationResultSerializer,
    VoiceObservationSerializer, VoiceObservationResultSerializer,
    TranslationSerializer, TranslationResultSerializer,
    SemanticSearchSerializer, DataQualityReportSerializer,
)
from .species_identifier import SpeciesIdentifier
from .voice_to_observation import VoiceToObservation
from .translator import Translator
from .semantic_search import SemanticSearch
from .data_quality import DataQualityScorer


class SpeciesIdentifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'image file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            for chunk in image.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            result = SpeciesIdentifier.identify(tmp_path)

            species_id = SpeciesIdentification.objects.create(
                image=image,
                user=request.user,
                suggested_species=result['species'],
                scientific_name=result.get('scientific_name', ''),
                confidence=result['confidence'],
                confidence_level=result['confidence_level'],
                all_predictions=result.get('all_predictions', []),
                processing_time_ms=result.get('processing_time_ms'),
            )

            return Response({
                'id': str(species_id.id),
                **result,
                'disclaimer': 'AI suggestion — requires human verification. This is not scientific confirmation.',
            })
        finally:
            os.unlink(tmp_path)


class SpeciesIdentifyListView(generics.ListAPIView):
    serializer_class = SpeciesIdentificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SpeciesIdentification.objects.filter(user=self.request.user)


class SpeciesVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            identification = SpeciesIdentification.objects.get(pk=pk)
        except SpeciesIdentification.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        verified_species_id = request.data.get('species_id')
        if verified_species_id:
            from guides.models import GuideSpecies
            try:
                species = GuideSpecies.objects.get(id=verified_species_id)
                identification.verified_species = species
                identification.is_human_verified = True
                identification.save()
                return Response({'message': 'Species verified.', 'species': species.common_name})
            except GuideSpecies.DoesNotExist:
                return Response({'error': 'Species not found.'}, status=status.HTTP_404_NOT_FOUND)

        identification.is_human_verified = True
        identification.save()
        return Response({'message': 'Marked as verified.'})


class VoiceTranscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        audio = request.FILES.get('audio')
        language = request.data.get('language', 'ta')
        engine = request.data.get('engine', 'auto')

        if not audio:
            return Response({'error': 'audio file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.ogg') as tmp:
            for chunk in audio.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            result = VoiceToObservation.process(tmp_path, language, engine)

            voice_obs = VoiceObservation.objects.create(
                audio_file=audio,
                user=request.user,
                language=language,
                transcribed_text=result['transcription']['transcript'],
                parsed_data=result['parsed_observation'],
                confidence=result['transcription'].get('confidence'),
                processing_time_ms=result['transcription'].get('processing_time_ms'),
                engine_used=result['transcription'].get('engine', ''),
            )

            return Response({
                'id': str(voice_obs.id),
                **result,
            })
        finally:
            os.unlink(tmp_path)


class VoiceObservationListView(generics.ListAPIView):
    serializer_class = VoiceObservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VoiceObservation.objects.filter(user=self.request.user)


class TranslateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TranslationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        text = serializer.validated_data['text']
        source = serializer.validated_data['source_language']
        target = serializer.validated_data['target_language']

        result = Translator.translate(text, source, target)

        TranslationLog.objects.create(
            source_text=text,
            source_language=source,
            target_language=target,
            translated_text=result['translated_text'],
            confidence=result.get('confidence'),
            engine=result.get('engine', ''),
        )

        return Response(result)


class SemanticSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SemanticSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        query = serializer.validated_data['query']
        search_type = serializer.validated_data['type']
        top_k = serializer.validated_data['top_k']

        if search_type == 'species':
            results = SemanticSearch.search_species(query, top_k)
        elif search_type == 'education':
            results = SemanticSearch.search_education(query, top_k)
        else:
            results = SemanticSearch.search_all(query, top_k)

        return Response({
            'query': query,
            'type': search_type,
            'results': results,
            'count': len(results),
        })


class DataQualityCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        contribution_id = request.data.get('contribution_id')
        if not contribution_id:
            return Response({'error': 'contribution_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        from contributions.models import Contribution
        try:
            contribution = Contribution.objects.get(id=contribution_id)
        except Contribution.DoesNotExist:
            return Response({'error': 'Contribution not found.'}, status=status.HTTP_404_NOT_FOUND)

        if contribution.user != request.user and request.user.role not in ['MODERATOR', 'ADMIN', 'SUPER_ADMIN']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        result = DataQualityScorer.score_contribution(contribution)

        report, _ = DataQualityReport.objects.update_or_create(
            contribution=contribution,
            defaults=result,
        )

        return Response({
            'contribution_id': str(contribution.id),
            'quality_report': DataQualityReportSerializer(report).data,
        })


class DataQualityBulkView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['MODERATOR', 'ADMIN', 'SUPER_ADMIN']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        from contributions.models import Contribution
        from django.db.models import Q

        contributions = Contribution.objects.filter(
            Q(quality_report__isnull=True) | Q(quality_report__overall_score=0),
            status__in=['submitted', 'auto_validated'],
        )[:100]

        results = []
        for c in contributions:
            result = DataQualityScorer.score_contribution(c)
            DataQualityReport.objects.update_or_create(
                contribution=c,
                defaults=result,
            )
            results.append({
                'contribution_id': str(c.id),
                'overall_score': result['overall_score'],
                'auto_validated': result['is_auto_validated'],
            })

        return Response({
            'processed': len(results),
            'results': results,
        })
