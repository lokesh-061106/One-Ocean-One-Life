from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import update_session_auth_hash
from core.permissions import IsAdmin
from .models import User, Profile
from .serializers import UserSerializer, ProfileSerializer, RegisterSerializer, ChangePasswordSerializer, UserCreateSerializer, UserUpdateSerializer, LoginSerializer


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Registration successful. Please login.'
        }, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = Profile.objects.select_related('user', 'village__district__zone').get_or_create(user=self.request.user)
        return profile


class UserListView(generics.ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['member_status', 'village', 'occupation']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'occupation']
    ordering_fields = ['contribution_score', 'created_at']

    def get_queryset(self):
        return Profile.objects.select_related('user', 'village__district__zone').all()


class PublicMemberListView(generics.ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['member_status', 'occupation']
    search_fields = ['user__first_name', 'user__last_name', 'occupation', 'village__name']
    ordering_fields = ['contribution_score', 'created_at']

    def get_queryset(self):
        return Profile.objects.select_related('user', 'village__district__zone').exclude(user__role='GUEST')


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Profile.objects.select_related('user', 'village__district__zone').all()


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        update_session_auth_hash(request, request.user)
        return Response({'message': 'Password updated successfully.'})


class UserCreateView(generics.CreateAPIView):
    serializer_class = UserCreateSerializer
    permission_classes = [IsAdmin]
    queryset = Profile.objects.select_related('user').all()


class UserUpdateView(generics.UpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAdmin]
    queryset = Profile.objects.select_related('user').all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProfileSerializer(instance).data)


class UserDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAdmin]
    queryset = Profile.objects.select_related('user').all()

    def perform_destroy(self, instance):
        instance.user.delete()
