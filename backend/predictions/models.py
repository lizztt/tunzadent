from django.db import models
from django.conf import settings

class Patient(models.Model):
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    patient_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other')
    ])
    phone_number = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    medical_history = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'patient'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.patient_id} - {self.first_name} {self.last_name}"

class XRayImage(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='xrays')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='xrays/%Y/%m/%d/')
    image_type = models.CharField(max_length=20, default='bitewing')
    tooth_region = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'xray_image'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"X-Ray for {self.patient.patient_id} - {self.uploaded_at}"

class Prediction(models.Model):
    xray = models.OneToOneField(XRayImage, on_delete=models.CASCADE, related_name='prediction')
    has_caries = models.BooleanField()
    confidence_score = models.FloatField()
    predicted_class = models.IntegerField()
    confidence_no_caries = models.FloatField()
    confidence_has_caries = models.FloatField()
    processing_time_ms = models.FloatField()
    model_version = models.CharField(max_length=50, default='v1.0')
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ], default='pending')
    error_message = models.TextField(blank=True)
    
    # Dentist review
    reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_predictions'
    )
    dentist_diagnosis = models.BooleanField(null=True, blank=True)
    dentist_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prediction'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Prediction for {self.xray.patient.patient_id} - {'Caries' if self.has_caries else 'No Caries'}"