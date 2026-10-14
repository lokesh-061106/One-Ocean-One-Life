"""Shared choice lists used across more than one Django app."""

# "Who are you?" — contributor identity captured at onboarding (Profile) and
# optionally overridden per submission (Contribution.contributor_type).
CONTRIBUTOR_TYPE_CHOICES = [
    ('fisher', 'Fisherman / Fisherwoman'),
    ('researcher', 'Researcher'),
    ('volunteer', 'Volunteer'),
    ('enthusiast', 'Recreational / Ocean Enthusiast'),
    ('student', 'Student'),
    ('organisation', 'Organisation / Institution'),
]
