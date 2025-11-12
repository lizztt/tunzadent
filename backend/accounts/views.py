from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail 
from .models import User
from .serializers import UserRegistrationSerializer, UserSerializer
import qrcode
import io
import base64
import pyotp
import random
import string


class RegisterView(generics.CreateAPIView):
    """Register new user and send verification email"""
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'Registration successful! Please check your email to verify your account.',
            'email': user.email
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """Verify email with token"""
    token = request.data.get('token')
    
    if not token:
        return Response(
            {'error': 'Token is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email_verification_token=token)
        
        if user.email_verified:
            return Response({
                'message': 'Email already verified',
                'email_verified': True
            })
        
        if user.verify_email(token):
            return Response({
                'message': 'Email verified successfully! Please log in to set up 2FA.',
                'email_verified': True
            })
        else:
            return Response(
                {'error': 'Invalid verification token'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid verification token'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login with username, password, and 2FA token"""
    username = request.data.get('username')
    password = request.data.get('password')
    two_fa_token = request.data.get('two_fa_token')
    
    # Authenticate user
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check email verification
    if not user.email_verified:
        return Response({
            'error': 'Please verify your email before logging in',
            'requires_email_verification': True,
            'email': user.email
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Check if 2FA setup is complete
    if not user.two_fa_setup_complete:
        return Response({
            'requires_2fa_setup': True,
            'message': 'Please set up 2FA to continue',
            'user_id': user.id,
            'username': username
        }, status=status.HTTP_200_OK)
    
    # Require 2FA token
    if not two_fa_token:
        return Response({
            'requires_2fa': True,
            'message': 'Please provide your 2FA code'
        }, status=status.HTTP_200_OK)
    
    # Verify 2FA token
    if not user.verify_2fa_token(two_fa_token):
        # Try backup code
        if not user.verify_backup_code(two_fa_token):
            return Response(
                {'error': 'Invalid 2FA code'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def setup_2fa_initial(request):
    """Initial 2FA setup for new users (after email verification)"""
    username = request.data.get('username')
    password = request.data.get('password')
    user_id = request.data.get('user_id')
    
    # Verify credentials
    user = authenticate(username=username, password=password)
    
    if not user or user.id != int(user_id):
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.email_verified:
        return Response(
            {'error': 'Please verify your email first'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if user.two_fa_setup_complete:
        return Response(
            {'error': '2FA already set up'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate 2FA secret
    secret = user.generate_2fa_secret()
    
    # Generate QR code
    qr_url = user.get_2fa_qr_code_url()
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return Response({
        'secret': secret,
        'qr_code': f'data:image/png;base64,{qr_code_base64}',
        'manual_entry_key': secret,
        'user_id': user.id
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_2fa_setup(request):
    """Complete 2FA setup and enable it"""
    username = request.data.get('username')
    password = request.data.get('password')
    user_id = request.data.get('user_id')
    token = request.data.get('token')
    
    # Verify credentials
    user = authenticate(username=username, password=password)
    
    if not user or user.id != int(user_id):
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not token:
        return Response(
            {'error': 'Token is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify token
    if not user.verify_2fa_token(token):
        return Response(
            {'error': 'Invalid 2FA code. Please try again.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Enable 2FA
    user.two_fa_enabled = True
    user.two_fa_setup_complete = True
    
    # Generate backup codes
    backup_codes = user.generate_backup_codes()
    
    user.save()
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'message': '2FA enabled successfully',
        'backup_codes': backup_codes,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get user profile"""
    return Response(UserSerializer(request.user).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile information"""
    user = request.user
    
    # Get data from request
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    email = request.data.get('email')
    
    # Update fields if provided
    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    if email is not None:
        # Check if email is already taken by another user
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return Response(
                {'error': 'Email already in use'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.email = email
    
    try:
        user.save()
        return Response(UserSerializer(user).data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response(
            {'error': 'Both old and new passwords are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check old password
    if not user.check_password(old_password):
        return Response(
            {'error': 'Current password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate new password length
    if len(new_password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate password complexity
    import re
    if not re.search(r'[A-Z]', new_password):
        return Response(
            {'error': 'Password must contain at least one uppercase letter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not re.search(r'[a-z]', new_password):
        return Response(
            {'error': 'Password must contain at least one lowercase letter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not re.search(r'[0-9]', new_password):
        return Response(
            {'error': 'Password must contain at least one number'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', new_password):
        return Response(
            {'error': 'Password must contain at least one special character'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password changed successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_backup_codes(request):
    """Regenerate backup codes for 2FA"""
    user = request.user
    
    if not user.two_fa_enabled:
        return Response(
            {'error': 'Two-factor authentication is not enabled'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate new backup codes (10 codes, 8 characters each)
    backup_codes = []
    for _ in range(10):
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        backup_codes.append(code)
    
    # Hash and store backup codes
    hashed_codes = [make_password(code) for code in backup_codes]
    user.backup_codes = hashed_codes
    user.save()
    
    return Response({
        'backup_codes': backup_codes,
        'message': 'Backup codes regenerated successfully'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_email(request):
    """Resend email verification link"""
    email = request.data.get('email')
    
    try:
        user = User.objects.get(email=email)
        
        if user.email_verified:
            return Response({
                'message': 'Email already verified'
            })
        
        # Generate new token and send email
        token = user.generate_email_verification_token()
        
        verification_link = f"http://localhost:3000/verify-email/{token}"
        
        send_mail(
            subject='Verify your Tunzadent account',
            message=f'Click here to verify: {verification_link}',
            from_email='noreply@tunzadent.com',
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        return Response({
            'message': 'Verification email sent'
        })
    
    except User.DoesNotExist:
        return Response(
            {'error': 'Email not found'},
            status=status.HTTP_404_NOT_FOUND
        )