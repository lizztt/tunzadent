from rest_framework import serializers
from .models import Patient, XRayImage, Prediction

class PatientSerializer(serializers.ModelSerializer):
    xray_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = ['id', 'patient_id', 'first_name', 'last_name', 
                  'date_of_birth', 'gender', 'phone_number', 'email',
                  'medical_history', 'xray_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_xray_count(self, obj):
        return obj.xrays.count()

class PredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = ['id', 'has_caries', 'confidence_score', 
                  'confidence_no_caries', 'confidence_has_caries',
                  'predicted_class', 'processing_time_ms', 'model_version',
                  'status', 'reviewed', 'dentist_diagnosis', 'dentist_notes',
                  'created_at']
        read_only_fields = ['id', 'created_at']

class XRayImageSerializer(serializers.ModelSerializer):
    prediction = PredictionSerializer(read_only=True)
    patient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = XRayImage
        fields = ['id', 'patient', 'patient_name', 'image', 'image_type',
                  'tooth_region', 'notes', 'uploaded_at', 'prediction']
        read_only_fields = ['id', 'uploaded_at']
    
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"