from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import Q


class GlobalSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', 'all')

        if not query:
            return Response({'results': []})

        results = []

        if search_type in ('all', 'guides'):
            from guides.models import GuideSpecies
            species = GuideSpecies.objects.filter(
                Q(common_name__icontains=query) |
                Q(tamil_name__icontains=query) |
                Q(scientific_name__icontains=query)
            )[:10]
            for s in species:
                results.append({
                    'type': 'guide',
                    'id': str(s.id),
                    'title': s.common_name,
                    'subtitle': s.scientific_name,
                    'image': s.image.url if s.image else None,
                })

        if search_type in ('all', 'education'):
            from education.models import EducationPost
            posts = EducationPost.objects.filter(
                Q(title__icontains=query) | Q(content__icontains=query)
            )[:10]
            for p in posts:
                results.append({
                    'type': 'education',
                    'id': str(p.id),
                    'title': p.title,
                    'subtitle': p.get_post_type_display(),
                })

        if search_type in ('all', 'events'):
            from community.models import Event
            events = Event.objects.filter(
                Q(title__icontains=query) | Q(description__icontains=query),
                is_published=True
            )[:10]
            for e in events:
                results.append({
                    'type': 'event',
                    'id': str(e.id),
                    'title': e.title,
                    'subtitle': e.get_event_type_display(),
                })

        if search_type in ('all', 'members'):
            from accounts.models import Profile
            members = Profile.objects.filter(
                Q(user__username__icontains=query) |
                Q(user__first_name__icontains=query) |
                Q(user__last_name__icontains=query) |
                Q(occupation__icontains=query)
            )[:10]
            for m in members:
                results.append({
                    'type': 'member',
                    'id': str(m.id),
                    'title': f"{m.user.first_name} {m.user.last_name}".strip() or m.user.username,
                    'subtitle': m.occupation or 'Community Member',
                })

        if search_type in ('all', 'emergency'):
            from maps.models import EmergencyContact
            contacts = EmergencyContact.objects.filter(
                Q(name__icontains=query) | Q(contact_type__icontains=query),
                is_active=True
            )[:5]
            for c in contacts:
                results.append({
                    'type': 'emergency',
                    'id': str(c.id),
                    'title': c.name,
                    'subtitle': c.get_contact_type_display(),
                })

        return Response({'results': results[:30], 'query': query})
