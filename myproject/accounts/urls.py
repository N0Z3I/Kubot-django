from django.urls import path, include
from .views import RegisterUserView, VerifyUserEmail, LoginUserView, TestAuthenticationView, PasswordResetConfirm, PasswordResetRequestView, SetNewPasswordView, LogoutUserView, ResendOtpView
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from .views import MykuLoginView, MykuDataView, DiscordConnectView, DiscordCallbackView, DiscordProfileView, StudentDataView, DiscordLogoutView, DeleteMykuDataView, UpdateProfileView

urlpatterns=[
    path('register/', RegisterUserView.as_view(), name = 'register'),
    path('verify-email/', VerifyUserEmail.as_view(), name = 'verify-email'),
    path('resend-otp/', ResendOtpView.as_view(), name='resend-otp'),
    path('login/', LoginUserView.as_view(), name = 'login'),
    path('profile/', TestAuthenticationView.as_view(), name = 'granted'),
    path('token/refresh/', TokenRefreshView.as_view(), name = 'refresh-token'),
    path('password-reset/', PasswordResetRequestView.as_view(), name = 'password-reset'),
    path('password-reset-confirm/<uidb64>/<token>/', PasswordResetConfirm.as_view(), name = 'password-reset-confirm'),
    path('set-new-password/', SetNewPasswordView.as_view(), name = 'set-new-password'),
    path('logout/', LogoutUserView.as_view(), name = 'logout'),
    path('myku-login/', MykuLoginView.as_view(), name='myku-login'),
    path('myku-data/', MykuDataView.as_view(), name='myku-data'),
    path('delete-myku-data/', DeleteMykuDataView.as_view(), name='delete-myku-data'),
    path('discord/connect/', DiscordConnectView.as_view(), name='discord-connect'),
    path('discord/callback/', DiscordCallbackView.as_view(), name='discord-callback'),
    path('discord/profile/', DiscordProfileView.as_view(), name='discord-profile'),
    path('discord/logout/', DiscordLogoutView.as_view(), name='discord-logout'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('student-data/', StudentDataView.as_view(), name='student-data'),
    path('update-profile/', UpdateProfileView.as_view(), name='update-profile'),
]
