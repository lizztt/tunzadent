from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Registration and verification
    path('register/', views.RegisterView.as_view(), name='register'),
    path('verify-email/', views.verify_email, name='verify_email'),
    path('resend-verification/', views.resend_verification_email, name='resend_verification'),
    
    # Login
    path('login/', views.login_view, name='login'),
    path('profile/', views.profile_view, name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # 2FA setup (mandatory for new users)
    path('2fa/setup/', views.setup_2fa_initial, name='setup_2fa_initial'),
    path('2fa/complete/', views.complete_2fa_setup, name='complete_2fa_setup'),
    path('2fa/regenerate-backup-codes/', views.regenerate_backup_codes, name='regenerate_backup_codes'),
    
    # Profile and Security Management
    path('profile/update/', views.update_profile, name='update_profile'),
    path('change-password/', views.change_password, name='change_password'),
]