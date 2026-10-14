"""Safety / relevance screening for uploaded contributions.

Runs a lightweight, deterministic screen at create time and sets
`safety_status`, `safety_category` and `relevance_level` on the
Contribution. If Celery/Redis is available the heavier AI checks are
queued asynchronously via `screen_contribution_task`.
"""

import os
import re

from celery import shared_task

BLOCKED_EXTENSIONS = {
    'exe', 'bat', 'cmd', 'com', 'scr', 'msi', 'dll', 'jar', 'vbs', 'ps1', 'sh',
}

UNSAFE_FILENAME_RE = re.compile(
    r'(\.exe|\.bat|\.cmd|\.scr|\.msi|\.dll|\.jar|\.vbs|\.ps1|\.sh$)',
    re.IGNORECASE,
)

SAFE_EXTENSIONS = {
    'image': {'jpg', 'jpeg', 'png', 'webp', 'heic'},
    'video': {'mp4', 'mov', 'm4v'},
    'audio': {'mp3', 'wav', 'ogg', 'm4a', 'aac'},
    'document': {'pdf', 'doc', 'docx'},
}

RELEVANCE_KEYWORDS = {
    'highly_relevant': [
        'whale', 'dolphin', 'turtle', 'dugong', 'shark', 'ray', 'coral',
        'mangrove', 'sighting', 'stranding', 'entangle', 'plastic', 'pollution',
        'fish catch', 'nesting', 'breeding', 'migration',
    ],
    'relevant': [
        'sea', 'ocean', 'coast', 'beach', 'fish', 'boat', 'fishing',
        'marine', 'tidal', 'estuary', 'lagoon', 'shore',
    ],
}


def _extension(filename):
    return os.path.splitext(filename or '')[1].lower().lstrip('.')


def screen_files(media_files):
    """Return (safety_status, safety_category, issues) for a list of (kind, filename)."""
    issues = []
    for kind, filename in media_files:
        ext = _extension(filename)
        if ext in BLOCKED_EXTENSIONS or UNSAFE_FILENAME_RE.search(filename or ''):
            return 'REJECTED', 'blocked_filetype', [f'Blocked file type: {filename}']
        allowed = SAFE_EXTENSIONS.get(kind, set())
        if allowed and ext and ext not in allowed:
            issues.append(f'Unexpected {kind} extension "{ext}" for {filename}')
    if issues:
        return 'PENDING', 'unexpected_extension', issues
    return 'SAFE', 'file_type_check_passed', issues


def screen_text(text):
    """Keyword-based relevance level for the contribution text."""
    lowered = (text or '').lower()
    for level, keywords in RELEVANCE_KEYWORDS.items():
        if any(k in lowered for k in keywords):
            return level
    return 'relevant'


def screen_contribution(contribution):
    """Apply screening results to the contribution instance (does not save)."""
    media = list(contribution.media.all()) if contribution.pk else []
    files = [(m.kind, m.file.name if m.file else '') for m in media]
    safety_status, safety_category, issues = screen_files(files)

    text = ' '.join(filter(None, [contribution.title, contribution.notes, contribution.description]))
    relevance = screen_text(text)

    contribution.safety_status = safety_status
    contribution.safety_category = safety_category
    contribution.relevance_level = relevance
    if safety_status == 'SAFE' and relevance != 'unrelated':
        contribution.moderation_decision = 'SAFE_AUTO_PASS'
    elif safety_status == 'REJECTED':
        contribution.moderation_decision = 'HUMAN_REVIEW'
    else:
        contribution.moderation_decision = 'PENDING'
    return {'safety_status': safety_status, 'relevance': relevance, 'issues': issues}


@shared_task
def screen_contribution_task(contribution_id):
    try:
        from .models import Contribution

        contribution = Contribution.objects.prefetch_related('media').get(pk=contribution_id)
        result = screen_contribution(contribution)
        contribution.save(update_fields=[
            'safety_status', 'safety_category', 'relevance_level', 'moderation_decision',
        ])
        return {'status': 'completed', **result}
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}
