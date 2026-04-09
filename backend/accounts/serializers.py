from rest_framework import serializers
from .models import User
from django.core.mail import send_mail
from django.conf import settings
import socket

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 
                  'first_name', 'last_name', 'role']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        
        if User.objects.filter(email=data['email']).exist():
            raise serializers.ValidationError("Email already registered")
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User(**validated_data)
        user.set_password(password)
        user.email_verified = False
        user.two_fa_setup_complete = False
        user.save()
        
        # Send verification email — non-blocking, won't fail registration
        try:
            token = user.generate_email_verification_token()
            self.send_verification_email(user, token)
        except Exception:
            pass  # User is saved; email failure is non-fatal
        
        return user
    
    def send_verification_email(self, user, token):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://tunzadent.vercel.app')
        verification_link = f"{frontend_url}/verify-email/{token}"
        
        subject = 'Verify your Tunzadent account'
        message = f'''
Hello {user.first_name or user.username},

Thank you for registering with Tunzadent Caries Detection System.

Please verify your email address by clicking the link below:
{verification_link}

This link will expire in 24 hours.

After verifying your email, you'll be required to set up 2FA for security.

Best regards,
Tunzadent Team
        '''
        
        old_timeout = socket.getdefaulttimeout()
        socket.setdefaulttimeout(5)  # 5-second cap on the SMTP connection
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        finally:
            socket.setdefaulttimeout(old_timeout)