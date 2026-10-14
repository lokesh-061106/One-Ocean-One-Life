import os
from pathlib import Path


def get_env(key, default=None):
    return os.environ.get(key, default)


def get_bool_env(key, default=False):
    value = os.environ.get(key, str(default))
    return value.lower() in ('true', '1', 'yes')


BASE_DIR = Path(__file__).resolve().parent.parent.parent
