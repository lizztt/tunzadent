# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """Custom admin interface for User model"""
    
    # List view configuration
    list_display = [
        'username', 
        'email', 
        'full_name', 
        'role', 
        'email_verified_badge',
        'two_fa_badge',
        'is_active_badge',
        'is_staff',
        'date_joined'
    ]
    
    list_filter = [
        'role', 
        'is_staff', 
        'is_superuser', 
        'is_active',
        'email_verified',
        'two_fa_enabled',
        'date_joined'
    ]
    
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    ordering = ['-date_joined']
    
    # Fieldsets for viewing/editing individual users
    fieldsets = (
        ('Basic Information', {
            'fields': ('username', 'password', 'email')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'role')
        }),
        ('Verification Status', {
            'fields': ('email_verified', 'email_verification_token')
        }),
        ('Two-Factor Authentication', {
            'fields': ('two_fa_enabled', 'two_fa_setup_complete', 'two_fa_secret')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined')
        }),
    )
    
    # Fieldsets for adding new users
    add_fieldsets = (
        ('Account Credentials', {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
        ('Personal Information', {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name', 'role'),
        }),
        ('Permissions', {
            'classes': ('wide',),
            'fields': ('is_active', 'is_staff', 'is_superuser'),
        }),
    )
    
    # Custom display methods
    def full_name(self, obj):
        """Display full name"""
        return f"{obj.first_name} {obj.last_name}" if obj.first_name and obj.last_name else "-"
    full_name.short_description = 'Full Name'
    
    def email_verified_badge(self, obj):
        """Display email verification status with colored badge"""
        if obj.email_verified:
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 3px 10px; border-radius: 3px; font-size: 11px;">✓ VERIFIED</span>'
            )
        return format_html(
            '<span style="background-color: #ef4444; color: white; padding: 3px 10px; border-radius: 3px; font-size: 11px;">✗ NOT VERIFIED</span>'
        )
    email_verified_badge.short_description = 'Email Status'
    
    def two_fa_badge(self, obj):
        """Display 2FA status with colored badge"""
        if obj.two_fa_enabled:
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 3px 10px; border-radius: 3px; font-size: 11px;">✓ ENABLED</span>'
            )
        return format_html(
            '<span style="background-color: #6b7280; color: white; padding: 3px 10px; border-radius: 3px; font-size: 11px;">✗ DISABLED</span>'
        )
    two_fa_badge.short_description = '2FA Status'
    
    def is_active_badge(self, obj):
        """Display account active status with colored badge"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 3px 10px; border-radius: 3px; font-size: 11px;">ACTIVE</span>'
            )
        return format_html(
            '<span style="background-color: #ef4444; color: white; padding: 3px 10px; border-radius: 3px; font-size: 11px;">INACTIVE</span>'
        )
    is_active_badge.short_description = 'Account Status'
    
    # Actions
    actions = ['activate_users', 'deactivate_users', 'verify_emails', 'enable_2fa']
    
    def activate_users(self, request, queryset):
        """Bulk activate user accounts"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} user(s) activated successfully.')
    activate_users.short_description = "Activate selected users"
    
    def deactivate_users(self, request, queryset):
        """Bulk deactivate user accounts"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} user(s) deactivated successfully.')
    deactivate_users.short_description = "Deactivate selected users"
    
    def verify_emails(self, request, queryset):
        """Bulk verify emails"""
        updated = queryset.update(email_verified=True)
        self.message_user(request, f'{updated} email(s) verified successfully.')
    verify_emails.short_description = "Verify emails for selected users"
    
    def enable_2fa(self, request, queryset):
        """Bulk enable 2FA"""
        updated = queryset.update(two_fa_enabled=True)
        self.message_user(request, f'{updated} user(s) 2FA enabled successfully.')
    enable_2fa.short_description = "Enable 2FA for selected users"