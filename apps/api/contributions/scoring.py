DEFAULT_SCORING = {
    'ocean_sound': {'verified': 20, 'submitted': 5},
    'marine_sighting': {'verified': 20, 'submitted': 5},
    'fish_catch': {'verified': 20, 'submitted': 5},
    'education_post': {'verified': 10, 'submitted': 3},
    'event': {'verified': 15, 'submitted': 5},
    'beach_cleanup': {'verified': 15, 'submitted': 5},
    'local_knowledge': {'verified': 15, 'submitted': 3},
    'observation': {'verified': 10, 'submitted': 3},
}


def calculate_contribution_points(contribution_type, status):
    scoring = DEFAULT_SCORING.get(contribution_type, {'verified': 10, 'submitted': 3})
    if status == 'verified':
        return scoring['verified']
    elif status in ('submitted', 'auto_validated', 'moderator_review'):
        return scoring['submitted']
    return 0


# --- Final Score = B x Q x V x I -------------------------------------------
# B = base points from Contribution_Catalogue
# Q = quality multiplier      0.50 / 1.00 / 1.20 / 1.50
# V = verification multiplier 0.50 / 1.00 / 1.50 / 2.00
# I = impact multiplier       1.00 / 1.50 / 2.00
# R (relevance) is a publication gate only — it is never multiplied in.

QUALITY_LEVELS = {
    0.5: 'Low quality',
    1.0: 'Standard',
    1.2: 'Good',
    1.5: 'High',
}

VERIFICATION_LEVELS = {
    0.5: 'Unverified',
    1.0: 'Community verified',
    1.5: 'Expert verified',
    2.0: 'High-value verified',
}

IMPACT_LEVELS = {
    1.0: 'Normal',
    1.5: 'Important',
    2.0: 'Very high',
}

RELEVANCE_GATE = {
    0.0: ('reject', 'Clearly unrelated'),
    0.5: ('review', 'Unclear — human review'),
    1.0: ('continue', 'Relevant'),
    1.5: ('continue', 'Highly relevant'),
}

MARKETPLACE_ELIGIBILITY_THRESHOLD = 25


def calculate_final_score_points(base_points, q=1.0, v=1.0, i=1.0):
    """Final Score = B × Q × V × I — the primary scoreboard number."""
    return round(float(base_points) * float(q) * float(v) * float(i), 2)


def relevance_gate(r):
    """R gate: 0 reject, 0.5 human review, 1.0/1.5 continue. R never multiplies the score."""
    r = float(r or 0)
    if r <= 0:
        return 'reject'
    if r < 1:
        return 'review'
    return 'continue'


def compute_contribution_score(contribution):
    """Recalculate and store B/Q/V/I fields + final_score_points on the contribution."""
    from decimal import Decimal

    base = Decimal(str(contribution.base_points or 10))
    q = Decimal(str(contribution.q_quality or 1))
    v = Decimal(str(contribution.v_verification or 1))
    i = Decimal(str(contribution.i_impact or 1))

    contribution.final_score_points = calculate_final_score_points(base, q, v, i)
    contribution.points = int(round(contribution.final_score_points))
    contribution.save(update_fields=['final_score_points', 'points'])
    return contribution.final_score_points


def is_marketplace_eligible(verified_count):
    """25 verified contributions unlock the marketplace."""
    return verified_count >= MARKETPLACE_ELIGIBILITY_THRESHOLD



def calculate_user_score(user):
    from contributions.models import Contribution
    from django.db.models import Sum

    total = Contribution.objects.filter(
        user=user,
        status__in=['verified', 'submitted', 'auto_validated']
    ).aggregate(total=Sum('points'))['total'] or 0
    return total


def calculate_village_score(village):
    from contributions.models import Contribution
    from django.db.models import Sum, Count

    stats = Contribution.objects.filter(
        village=village,
        status='verified'
    ).aggregate(
        total_points=Sum('points'),
        total_contributions=Count('id')
    )
    return {
        'points': stats['total_points'] or 0,
        'contributions': stats['total_contributions'] or 0,
    }


def detect_duplicate(user, contribution_type, latitude, longitude, radius_km=1.0):
    from contributions.models import Contribution
    from django.contrib.gis.geos import Point
    from django.contrib.gis.measure import D

    if not latitude or not longitude:
        return False

    point = Point(longitude, latitude, srid=4326)
    nearby = Contribution.objects.filter(
        user=user,
        type=contribution_type,
        status__in=['submitted', 'verified'],
        location__distance_lte=(point, D(km=radius_km))
    ).exists()
    return nearby
