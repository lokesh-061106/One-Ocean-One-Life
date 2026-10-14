import os
import logging
import math
from collections import Counter

logger = logging.getLogger(__name__)


class SemanticSearch:
    _embeddings = None

    @classmethod
    def _get_embedding(cls, text: str) -> list:
        try:
            from sentence_transformers import SentenceTransformer
            if cls._embeddings is None:
                cls._embeddings = SentenceTransformer('all-MiniLM-L6-v2')
            return cls._embeddings.encode(text).tolist()
        except ImportError:
            return cls._tfidf_embedding(text)

    @classmethod
    def _tfidf_embedding(cls, text: str) -> list:
        import hashlib
        words = text.lower().split()
        vocab_size = 256
        embedding = [0.0] * vocab_size

        for word in words:
            idx = int(hashlib.md5(word.encode()).hexdigest(), 16) % vocab_size
            embedding[idx] += 1.0

        norm = math.sqrt(sum(x * x for x in embedding))
        if norm > 0:
            embedding = [x / norm for x in embedding]

        return embedding

    @classmethod
    def cosine_similarity(cls, a: list, b: list) -> float:
        if len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    @classmethod
    def search(cls, query: str, documents: list, top_k: int = 10) -> list:
        query_embedding = cls._get_embedding(query)

        results = []
        for doc in documents:
            doc_text = doc.get('text', '') or doc.get('title', '') or doc.get('description', '')
            if not doc_text:
                continue

            doc_embedding = cls._get_embedding(doc_text)
            similarity = cls.cosine_similarity(query_embedding, doc_embedding)

            results.append({
                **doc,
                'relevance_score': round(similarity, 4),
            })

        results.sort(key=lambda x: x['relevance_score'], reverse=True)
        return results[:top_k]

    @classmethod
    def search_species(cls, query: str, top_k: int = 10) -> list:
        from guides.models import GuideSpecies

        species = GuideSpecies.objects.filter(is_verified=True).values(
            'id', 'common_name', 'tamil_name', 'scientific_name',
            'description', 'habitat', 'behavior',
        )[:500]

        documents = []
        for s in species:
            text_parts = [
                s.get('common_name', ''),
                s.get('tamil_name', ''),
                s.get('scientific_name', ''),
                s.get('description', ''),
                s.get('habitat', ''),
                s.get('behavior', ''),
            ]
            documents.append({
                'id': str(s['id']),
                'title': s['common_name'],
                'type': 'species',
                'text': ' '.join(filter(None, text_parts)),
            })

        return cls.search(query, documents, top_k)

    @classmethod
    def search_education(cls, query: str, top_k: int = 10) -> list:
        from education.models import EducationPost

        posts = EducationPost.objects.filter(is_verified=True).values(
            'id', 'title', 'content', 'post_type',
        )[:500]

        documents = []
        for p in posts:
            documents.append({
                'id': str(p['id']),
                'title': p['title'],
                'type': 'education',
                'subtype': p['post_type'],
                'text': f"{p['title']} {p['content']}",
            })

        return cls.search(query, documents, top_k)

    @classmethod
    def search_all(cls, query: str, top_k: int = 10) -> list:
        results = []
        results.extend(cls.search_species(query, top_k))
        results.extend(cls.search_education(query, top_k))
        results.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
        return results[:top_k]
