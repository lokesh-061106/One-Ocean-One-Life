import os
import json
import hashlib
import hmac
import time
from urllib.parse import urlencode
from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')

APPLE_CLIENT_ID = os.environ.get('APPLE_CLIENT_ID', '')
APPLE_TEAM_ID = os.environ.get('APPLE_TEAM_ID', '')
APPLE_KEY_ID = os.environ.get('APPLE_KEY_ID', '')


def verify_google_token(id_token_str):
    try:
        idinfo = id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
        return {
            'provider': 'google',
            'provider_user_id': idinfo['sub'],
            'email': idinfo.get('email'),
            'name': idinfo.get('name', ''),
            'picture': idinfo.get('picture', ''),
            'email_verified': idinfo.get('email_verified', False),
        }
    except Exception as e:
        return None


def verify_apple_token(identity_token, authorization_code=None):
    try:
        from jose import jwt as jose_jwt

        signing_key = get_apple_signing_key()
        payload = jose_jwt.decode(
            identity_token,
            signing_key,
            algorithms=['RS256'],
            audience=APPLE_CLIENT_ID,
            issuer='https://appleid.apple.com',
        )
        return {
            'provider': 'apple',
            'provider_user_id': payload['sub'],
            'email': payload.get('email'),
            'name': '',
            'email_verified': payload.get('email_verified', False),
        }
    except Exception as e:
        return None


def get_apple_signing_key():
    import requests
    response = requests.get('https://appleid.apple.com/auth/keys')
    keys = response.json().get('keys', [])
    from jose import jwk
    kid = APPLE_KEY_ID
    for key in keys:
        if key['kid'] == kid:
            return jwk.construct(key)
    return None


def get_or_create_oauth_user(oauth_data):
    from .models import User, Profile

    provider = oauth_data['provider']
    provider_user_id = oauth_data['provider_user_id']
    email = oauth_data.get('email')

    user = User.objects.filter(
        oauth_provider=provider,
        oauth_provider_id=provider_user_id,
    ).first()

    if user:
        return user, False

    if email:
        user = User.objects.filter(email=email).first()
        if user:
            user.oauth_provider = provider
            user.oauth_provider_id = provider_user_id
            user.is_verified = oauth_data.get('email_verified', False)
            user.save()
            return user, False

    username = email.split('@')[0] if email else f"{provider}_{provider_user_id[:8]}"
    base_username = username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1

    user = User.objects.create(
        username=username,
        email=email or '',
        first_name=oauth_data.get('name', '').split()[0] if oauth_data.get('name') else '',
        last_name=' '.join(oauth_data.get('name', '').split()[1:]) if oauth_data.get('name') else '',
        oauth_provider=provider,
        oauth_provider_id=provider_user_id,
        is_verified=oauth_data.get('email_verified', False),
        role='COMMUNITY_MEMBER',
    )

    Profile.objects.create(user=user)

    return user, True
