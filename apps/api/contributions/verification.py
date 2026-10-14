from django.utils import timezone
from .models import Contribution, VerificationHistory


# Single source of truth for status transitions — used by the review endpoint,
# the auto-validate task and any future workflow code.
STATUS_TRANSITIONS = {
    'draft': ['submitted', 'verified', 'rejected'],
    'submitted': ['auto_validated', 'moderator_review', 'scientific_review', 'verified', 'rejected'],
    'auto_validated': ['moderator_review', 'scientific_review', 'verified', 'rejected'],
    'moderator_review': ['scientific_review', 'verified', 'rejected'],
    'scientific_review': ['verified', 'rejected', 'moderator_review'],
    'rejected': ['submitted', 'verified'],
    'duplicate': ['submitted', 'verified'],
    # verified→verified allowed so re-approve can re-publish missing module children
    'verified': ['rejected', 'moderator_review', 'verified'],
}


def can_transition(from_status, to_status):
    allowed = STATUS_TRANSITIONS.get(from_status, [])
    return to_status in allowed


def transition_contribution(contribution, to_status, reviewer=None, notes='', confidence=0):
    from_status = contribution.status

    if not can_transition(from_status, to_status):
        raise ValueError(f"Cannot transition from {from_status} to {to_status}")

    history = VerificationHistory.objects.create(
        contribution=contribution,
        action='transition',
        from_status=from_status,
        to_status=to_status,
        reviewer=reviewer,
        notes=notes,
        confidence_score=confidence,
    )

    contribution.status = to_status
    if to_status == 'verified':
        contribution.verified_by = reviewer
        contribution.verified_at = timezone.now()
        contribution.save()
        # Publish so any path that verifies also materialises module children.
        from .publishing import publish_contribution
        publish_contribution(contribution)
        return history
    contribution.save()

    return history


def auto_validate(contribution):
    if contribution.status != 'submitted':
        return False

    if not contribution.notes and not contribution.metadata:
        return False

    if not contribution.location:
        return False

    transition_contribution(
        contribution,
        'auto_validated',
        notes='Auto-validated: All required fields present',
        confidence=80,
    )
    return True


def submit_for_review(contribution, level_name='moderator_review'):
    if contribution.status not in ('submitted', 'auto_validated', 'rejected'):
        return False

    transition_contribution(
        contribution,
        level_name,
        notes='Submitted for review',
    )
    return True


def approve(contribution, reviewer, notes='', confidence=90):
    if contribution.status in ('moderator_review', 'scientific_review'):
        transition_contribution(
            contribution,
            'verified',
            reviewer=reviewer,
            notes=notes,
            confidence=confidence,
        )
        return True
    return False


def reject(contribution, reviewer, notes=''):
    if contribution.status in ('moderator_review', 'scientific_review', 'submitted'):
        transition_contribution(
            contribution,
            'rejected',
            reviewer=reviewer,
            notes=notes,
        )
        return True
    return False


def request_more_info(contribution, reviewer, notes=''):
    """Record a 'needs more info' review event without changing the status.

    The contribution stays in its current review state; the request is kept as
    an audit-trail entry the contributor (and later reviewers) can see.
    """
    if contribution.status not in ('moderator_review', 'scientific_review'):
        return False

    return bool(VerificationHistory.objects.create(
        contribution=contribution,
        action='needs_info',
        from_status=contribution.status,
        to_status=contribution.status,
        reviewer=reviewer,
        notes=notes,
    ))


def get_verification_queue(level_name=None, reviewer_role=None):
    queryset = Contribution.objects.filter(
        status__in=['submitted', 'auto_validated', 'moderator_review', 'scientific_review'],
    ).select_related('user', 'village')

    if level_name:
        queryset = queryset.filter(status=level_name)

    return queryset.order_by('created_at')
