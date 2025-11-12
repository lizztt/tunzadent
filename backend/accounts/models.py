from django.contrib.auth.models import AbstractUser
from django.db import models
import pyotp
import secrets

class User(AbstractUser):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=20, choices=[
        ('dentist', 'Dentist'),
        ('admin', 'Admin'),
        ('staff', 'Staff')
    ], default='dentist')
    
    # Email verification
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True, null=True)
    
    # 2FA fields (MANDATORY after email verification)
    two_fa_enabled = models.BooleanField(default=False)
    two_fa_secret = models.CharField(max_length=32, blank=True)
    two_fa_setup_complete = models.BooleanField(default=False)  # NEW: Track if 2FA setup done
    
    # Backup codes
    backup_codes = models.JSONField(default=list, blank=True)
    
    def generate_email_verification_token(self):
        """Generate unique token for email verification"""
        self.email_verification_token = secrets.token_urlsafe(32)
        self.save()
        return self.email_verification_token
    
    def verify_email(self, token):
        """Verify email with token"""
        if self.email_verification_token == token:
            self.email_verified = True
            self.email_verification_token = None
            self.save()
            return True
        return False
    
    def generate_2fa_secret(self):
        """Generate 2FA secret"""
        if not self.two_fa_secret:
            self.two_fa_secret = pyotp.random_base32()
            self.save()
        return self.two_fa_secret
    
    def verify_2fa_token(self, token):
        """Verify 2FA token"""
        if not self.two_fa_secret:
            return False
        totp = pyotp.TOTP(self.two_fa_secret)
        return totp.verify(token, valid_window=2)
    
    def get_2fa_qr_code_url(self):
        """Get QR code URL for 2FA setup"""
        totp = pyotp.TOTP(self.two_fa_secret)
        return totp.provisioning_uri(
            name=self.email,
            issuer_name='Tunzadent Caries Detection'
        )
    
    def generate_backup_codes(self):
        """Generate backup codes for 2FA recovery"""
        codes = [secrets.token_hex(4).upper() for _ in range(10)]
        self.backup_codes = codes
        self.save()
        return codes
    
    def verify_backup_code(self, code):
        """Verify and consume backup code"""
        if code.upper() in self.backup_codes:
            self.backup_codes.remove(code.upper())
            self.save()
            return True
        return False
    
    def can_login(self):
        """Check if user can login (email verified + 2FA setup)"""
        return self.email_verified and self.two_fa_setup_complete