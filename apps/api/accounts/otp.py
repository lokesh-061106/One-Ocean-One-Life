import os
import random
import string
from datetime import timedelta
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from twilio.rest import Client as TwilioClient


OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
OTP_COOLDOWN_SECONDS = 60
MAX_OTP_ATTEMPTS = 5


def generate_otp():
    return ''.join(random.choices(string.digits, k=OTP_LENGTH))


def get_otp_cache_key(phone, purpose='login'):
    return f"otp:{purpose}:{phone}"


def get_otp_attempts_key(phone, purpose='login'):
    return f"otp_attempts:{purpose}:{phone}"


def get_otp_cooldown_key(phone, purpose='login'):
    return f"otp_cooldown:{purpose}:{phone}"


def store_otp(phone, otp, purpose='login'):
    cache_key = get_otp_cache_key(phone, purpose)
    cache.set(cache_key, otp, OTP_EXPIRY_MINUTES * 60)


def verify_otp(phone, otp, purpose='login'):
    cache_key = get_otp_cache_key(phone, purpose)
    stored_otp = cache.get(cache_key)

    if not stored_otp:
        return False, 'OTP expired or not found'

    attempts_key = get_otp_attempts_key(phone, purpose)
    attempts = cache.get(attempts_key, 0)

    if attempts >= MAX_OTP_ATTEMPTS:
        cache.delete(cache_key)
        cache.delete(attempts_key)
        return False, 'Too many attempts. Please request a new OTP'

    if stored_otp != otp:
        cache.set(attempts_key, attempts + 1, OTP_EXPIRY_MINUTES * 60)
        remaining = MAX_OTP_ATTEMPTS - attempts - 1
        return False, f'Invalid OTP. {remaining} attempts remaining'

    cache.delete(cache_key)
    cache.delete(attempts_key)
    return True, 'OTP verified'


def check_cooldown(phone, purpose='login'):
    cooldown_key = get_otp_cooldown_key(phone, purpose)
    return cache.get(cooldown_key) is not None


def set_cooldown(phone, purpose='login'):
    cooldown_key = get_otp_cooldown_key(phone, purpose)
    cache.set(cooldown_key, True, OTP_COOLDOWN_SECONDS)


def send_otp_sms(phone, otp):
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_number = os.environ.get('TWILIO_PHONE_NUMBER')

    if not all([account_sid, auth_token, from_number]):
        print(f"[DEV MODE] OTP for {phone}: {otp}")
        return True

    try:
        client = TwilioClient(account_sid, auth_token)
        message = client.messages.create(
            body=f'Your O3L verification code is: {otp}. Valid for {OTP_EXPIRY_MINUTES} minutes.',
            from_=from_number,
            to=phone,
        )
        return True
    except Exception as e:
        print(f"Twilio error: {e}")
        return False


def initiate_otp(phone, purpose='login'):
    if check_cooldown(phone, purpose):
        return False, f'Please wait {OTP_COOLDOWN_SECONDS} seconds before requesting a new OTP'

    otp = generate_otp()
    store_otp(phone, otp, purpose)
    set_cooldown(phone, purpose)

    sent = send_otp_sms(phone, otp)
    if not sent:
        return False, 'Failed to send OTP. Please try again'

    return True, 'OTP sent successfully'
