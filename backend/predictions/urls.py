from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router for ViewSet (Patient CRUD operations)
router = DefaultRouter()
router.register(r'patients', views.PatientViewSet, basename='patient')

urlpatterns = [
    # ViewSet routes (automatically generates list, create, retrieve, update, destroy)
    path('', include(router.urls)),
    
    # Single & Bulk Upload: Upload X-ray and get AI prediction
    # Supports both single upload and bulk upload workflows
    # POST /api/predictions/upload-predict/
    path('upload-predict/', views.upload_and_predict, name='upload-predict'),
    
    # Dashboard Statistics: Get simplified stats for dashboard
    # Returns: total_predictions, with_caries, total_patients
    # GET /api/predictions/stats/
    path('stats/', views.prediction_stats, name='prediction-stats'),
    
    # Patient Scan History: Get all scans for a specific patient
    # GET /api/predictions/patients/<patient_id>/scans/
    path('patients/<int:patient_id>/scans/', views.get_patient_scans, name='patient-scans'),
    
    # Scan Details: Get detailed info about a specific scan with AI results
    # Includes prediction, attention heatmap, and recommendations
    # GET /api/predictions/scans/<scan_id>/
    path('scans/<int:scan_id>/', views.get_scan_details, name='scan-details'),
]