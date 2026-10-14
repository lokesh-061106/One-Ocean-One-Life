from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from . import views
from . import views_auth

urlpatterns = [
    # Email/Password Auth
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # OTP Auth
    path('otp/request/', views_auth.OTPRequestView.as_view(), name='otp_request'),
    path('otp/verify/', views_auth.OTPVerifyView.as_view(), name='otp_verify'),

    # OAuth
    path('oauth/google/', views_auth.GoogleLoginView.as_view(), name='google_login'),
    path('oauth/apple/', views_auth.AppleLoginView.as_view(), name='apple_login'),

    # Session Management
    path('logout/', views_auth.LogoutView.as_view(), name='logout'),
    path('logout-all/', views_auth.LogoutAllView.as_view(), name='logout_all'),
    path('sessions/', views_auth.SessionListView.as_view(), name='session_list'),

    # Device Management
    path('devices/register/', views_auth.DeviceRegisterView.as_view(), name='device_register'),
    path('devices/remove/', views_auth.DeviceRemoveView.as_view(), name='device_remove'),

    # Profile
    path('me/', views.MeView.as_view(), name='me'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),

    # User Management
    path('members/', views.PublicMemberListView.as_view(), name='public_member_list'),
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/create/', views.UserCreateView.as_view(), name='user_create'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('users/<uuid:pk>/update/', views.UserUpdateView.as_view(), name='user_update'),
    path('users/<uuid:pk>/delete/', views.UserDeleteView.as_view(), name='user_delete'),
]
