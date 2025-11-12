from rest_framework import serializers
from .models import User
from django.core.mail import send_mail
from django.conf import settings

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
        
        if User.objects.filter(email=data['email']).exists():
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
        
        # Generate and send verification email
        token = user.generate_email_verification_token()
        self.send_verification_email(user, token)
        
        return user
    
    def send_verification_email(self, user, token):
        """Send email verification link"""
        verification_link = f"http://localhost:3000/verify-email/{token}"
        
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
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'role', 'email_verified', 'two_fa_enabled', 'two_fa_setup_complete']
        read_only_fields = ['id', 'email_verified', 'two_fa_enabled', 'two_fa_setup_complete']