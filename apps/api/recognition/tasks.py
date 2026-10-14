from celery import shared_task


@shared_task
def refresh_recognition_scores_task(user_ids=None):
    """Recompute B×Q×V×I totals, ₹ earnings, tiers and badges for all users."""
    try:
        from .services import refresh_all_scores

        updated = refresh_all_scores(user_ids)
        return {'status': 'completed', 'updated': updated}
    except Exception as e:  # noqa: BLE001
        return {'status': 'failed', 'error': str(e)}


@shared_task
def refresh_one_score_task(user_id):
    try:
        from accounts.models import User

        from .services import refresh_user_score

        user = User.objects.get(id=user_id)
        result = refresh_user_score(user)
        return {'status': 'completed', 'user_id': str(user_id), **result}
    except Exception as e:  # noqa: BLE001
        return {'status': 'failed', 'error': str(e)}
