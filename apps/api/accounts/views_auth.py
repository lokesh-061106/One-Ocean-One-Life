import os
import secrets
from datetime import timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Profile
from .otp import initiate_otp, verify_otp
from .oauth import verify_google_token, verify_apple_token, get_or_create_oauth_user
from .serializers import UserSerializer

User = get_user_model()


class OTPRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        purpose = request.data.get('purpose', 'login')

        if not phone:
            return Response(
                {'error': 'Phone number is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if purpose not in ('login', 'register', 'verify'):
            return Response(
                {'error': 'Invalid purpose'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, message = initiate_otp(phone, purpose)

        if not success:
            return Response(
                {'error': message},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        return Response({'message': message, 'phone': phone})


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        otp_code = request.data.get('otp', '').strip()
        purpose = request.data.get('purpose', 'login')

        if not phone or not otp_code:
            return Response(
                {'error': 'Phone and OTP are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, message = verify_otp(phone, otp_code, purpose)

        if not success:
            return Response(
                {'error': message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if purpose == 'verify':
            user = User.objects.filter(phone=phone).first()
            if user:
                user.is_verified = True
                user.save()
            return Response({'message': 'Phone verified successfully'})

        user, created = User.objects.get_or_create(
            phone=phone,
            defaults={
                'username': phone,
                'role': 'COMMUNITY_MEMBER',
                'is_verified': True,
            },
        )

        if not user.is_verified:
            user.is_verified = True
            user.save()

        if created:
            Profile.objects.get_or_create(user=user)

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'created': created,
        })


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        id_token_str = request.data.get('id_token')

        if not id_token_str:
            return Response(
                {'error': 'Google ID token is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        oauth_data = verify_google_token(id_token_str)
        if not oauth_data:
            return Response(
                {'error': 'Invalid Google token'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user, created = get_or_create_oauth_user(oauth_data)

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'created': created,
        })


class AppleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identity_token = request.data.get('identity_token')

        if not identity_token:
            return Response(
                {'error': 'Apple identity token is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        oauth_data = verify_apple_token(identity_token)
        if not oauth_data:
            return Response(
                {'error': 'Invalid Apple token'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user, created = get_or_create_oauth_user(oauth_data)

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'created': created,
        })


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass

        return Response({'message': 'Logged out successfully'})


class LogoutAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

        tokens = OutstandingToken.objects.filter(user=request.user)
        for token in tokens:
            BlacklistedToken.objects.get_or_create(token=token)

        return Response({'message': 'Logged out from all devices'})


class SessionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

        tokens = OutstandingToken.objects.filter(
            user=request.user,
            blacklistedtoken__isnull=True,
        ).select_related('token_ptr')

        sessions = []
        for token in tokens:
            sessions.append({
                'id': str(token.id),
                'created_at': token.created_at.isoformat(),
                'expires_at': token.expires_at.isoformat(),
                'user_agent': getattr(token, 'user_agent', ''),
            })

        return Response({'sessions': sessions})


class DeviceRegisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        device_token = request.data.get('device_token')
        platform = request.data.get('platform')

        if not device_token or not platform:
            return Response(
                {'error': 'device_token and platform are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if platform not in ('android', 'ios', 'web'):
            return Response(
                {'error': 'platform must be android, ios, or web'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .models import DeviceToken
        device, created = DeviceToken.objects.update_or_create(
            user=request.user,
            device_token=device_token,
            defaults={'platform': platform, 'is_active': True},
        )

        return Response({
            'message': 'Device registered',
            'created': created,
        })


class DeviceRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        device_token = request.data.get('device_token')

        if not device_token:
            return Response(
                {'error': 'device_token is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .models import DeviceToken
        DeviceToken.objects.filter(
            user=request.user,
            device_token=device_token,
        ).update(is_active=False)

        return Response({'message': 'Device removed'})
