from django.forms import ValidationError
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Patient, XRayImage, Prediction
from .serializers import PatientSerializer, XRayImageSerializer, PredictionSerializer
from .ml_inference import CariesDetector

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Patient.objects.filter(created_by=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        xray_count = instance.xrays.count()
        instance.delete()
        print(f"Deleted patient {instance.patient_id} with {xray_count} X-rays")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_and_predict(request):
    """
    Upload X-ray image and get AI prediction with attention visualization
    Supports both single and bulk upload workflows
    """
    
    # Validate required fields
    patient_id = request.data.get('patient_id')
    image = request.FILES.get('image')
    
    if not patient_id or not image:
        return Response(
            {'error': 'patient_id and image are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get patient
    patient = get_object_or_404(
        Patient, 
        id=patient_id,
        created_by=request.user
    )
    
    # Save X-ray image
    xray = XRayImage.objects.create(
        patient=patient,
        uploaded_by=request.user,
        image=image,
        image_type=request.data.get('image_type', 'bitewing'),
        tooth_region=request.data.get('tooth_region', ''),
        notes=request.data.get('notes', '')
    )
    
    # Create prediction entry
    prediction = Prediction.objects.create(
        xray=xray,
        status='processing',
        has_caries=False,
        confidence_score=0.0,
        predicted_class=0,
        confidence_no_caries=0.0,
        confidence_has_caries=0.0,
        processing_time_ms=0.0
    )
    
    # Run AI inference with attention and recommendations
    try:
        detector = CariesDetector()
        
        # Get prediction with attention heatmap and recommendations
        result = detector.predict(
            xray.image.path,
            return_attention=True,
            return_recommendations=True
        )
        
        if result['success']:
            # Update prediction with results
            prediction.has_caries = result['has_caries']
            prediction.confidence_score = result['confidence_score']
            prediction.confidence_no_caries = result['confidence_no_caries']
            prediction.confidence_has_caries = result['confidence_has_caries']
            prediction.predicted_class = result['predicted_class']
            prediction.processing_time_ms = result['processing_time_ms']
            prediction.model_version = result.get('model_version', 'MAE-ViT-v2.0')
            prediction.status = 'completed'
            prediction.save()
            
            # Build comprehensive response
            response_data = {
                'xray': {
                    'id': xray.id,
                    'patient_id': patient.id,
                    'patient_name': f"{patient.first_name} {patient.last_name}",
                    'uploaded_at': xray.uploaded_at.isoformat(),
                    'image_type': xray.image_type,
                    'tooth_region': xray.tooth_region,
                    'notes': xray.notes,
                    'image_url': request.build_absolute_uri(xray.image.url)
                },
                'prediction': {
                    'id': prediction.id,
                    'has_caries': prediction.has_caries,
                    'confidence_score': float(prediction.confidence_score),
                    'confidence_no_caries': float(prediction.confidence_no_caries),
                    'confidence_has_caries': float(prediction.confidence_has_caries),
                    'predicted_class': prediction.predicted_class,
                    'processing_time_ms': float(prediction.processing_time_ms),
                    'model_version': prediction.model_version,
                    'status': prediction.status,
                    'created_at': prediction.created_at.isoformat()
                },
                'explainability': {
                    'attention_heatmap': result.get('attention_heatmap'),
                    'visualization_type': 'attention_rollout',
                    'description': 'Heatmap shows areas the AI focused on when making the prediction. Warmer colors (red/yellow) indicate higher attention, cooler colors (blue) indicate lower attention.'
                },
                'recommendations': result.get('recommendations', {})
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        else:
            # Prediction failed
            prediction.status = 'failed'
            prediction.error_message = result.get('error', 'Unknown error')
            prediction.save()
            
            return Response(
                {
                    'error': 'Prediction failed',
                    'details': result.get('error', 'Unknown error'),
                    'xray': XRayImageSerializer(xray).data,
                    'prediction': PredictionSerializer(prediction).data
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        prediction.status = 'failed'
        prediction.error_message = str(e)
        prediction.save()
        
        return Response(
            {
                'error': 'Prediction processing failed',
                'details': str(e),
                'xray': XRayImageSerializer(xray).data,
                'prediction': PredictionSerializer(prediction).data
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prediction_stats(request):
    """
    Get simplified prediction statistics for the dashboard
    Returns: total analyses, cases with findings, total patients
    """
    predictions = Prediction.objects.filter(
        xray__uploaded_by=request.user,
        status='completed'
    )
    
    total = predictions.count()
    with_caries = predictions.filter(has_caries=True).count()
    without_caries = predictions.filter(has_caries=False).count()
    
    # Get total patients for this user
    total_patients = Patient.objects.filter(
        created_by=request.user
    ).count()

    # Calculate average confidence (kept for internal use if needed)
    avg_confidence = 0.0
    if total > 0:
        total_confidence = sum(float(p.confidence_score) for p in predictions)
        avg_confidence = total_confidence / total
    
    return Response({
        'total_predictions': total,
        'with_caries': with_caries,
        'without_caries': without_caries,
        'total_patients': total_patients,
        'average_confidence': round(avg_confidence, 2),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_scans(request, patient_id):
    """Get all scans for a specific patient with prediction results"""
    try:
        # Get patient and verify ownership
        patient = get_object_or_404(
            Patient,
            id=patient_id,
            created_by=request.user
        )
        
        # Get all X-rays for this patient
        scans = XRayImage.objects.filter(
            patient=patient
        ).order_by('-uploaded_at')
        
        # Build scan data with predictions
        scan_data = []
        for scan in scans:
            try:
                prediction = Prediction.objects.get(xray=scan, status='completed')
                prediction_data = {
                    'id': prediction.id,
                    'has_caries': prediction.has_caries,
                    'confidence_score': float(prediction.confidence_score),
                    'confidence_has_caries': float(prediction.confidence_has_caries),
                    'confidence_no_caries': float(prediction.confidence_no_caries),
                    'processing_time_ms': float(prediction.processing_time_ms),
                    'model_version': prediction.model_version,
                    'created_at': prediction.created_at.isoformat()
                }
            except Prediction.DoesNotExist:
                prediction_data = None
            
            scan_dict = {
                'id': scan.id,
                'uploaded_at': scan.uploaded_at.isoformat(),
                'image_type': scan.image_type,
                'tooth_region': scan.tooth_region,
                'notes': scan.notes,
                'image_url': request.build_absolute_uri(scan.image.url) if scan.image else None,
                'prediction': prediction_data
            }
            
            scan_data.append(scan_dict)
        
        # Return patient info and scans
        return Response({
            'patient': {
                'id': patient.id,
                'patient_id': patient.patient_id,
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'date_of_birth': patient.date_of_birth.isoformat() if patient.date_of_birth else None,
                'gender': patient.gender
            },
            'scans': scan_data,
            'total_scans': len(scan_data)
        })
        
    except Patient.DoesNotExist:
        return Response(
            {'error': 'Patient not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to load scan history: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_scan_details(request, scan_id):
    """
    Get detailed information about a specific scan with attention visualization
    and clinical recommendations
    """
    try:
        # Get X-ray and verify ownership
        scan = get_object_or_404(
            XRayImage,
            id=scan_id,
            uploaded_by=request.user
        )
        
        # Get prediction if it exists
        prediction_data = None
        attention_heatmap = None
        recommendations = None
        
        try:
            prediction = Prediction.objects.get(xray=scan, status='completed')
            prediction_data = {
                'id': prediction.id,
                'has_caries': prediction.has_caries,
                'confidence_score': float(prediction.confidence_score),
                'confidence_has_caries': float(prediction.confidence_has_caries),
                'confidence_no_caries': float(prediction.confidence_no_caries),
                'processing_time_ms': float(prediction.processing_time_ms),
                'model_version': prediction.model_version,
                'predicted_class': prediction.predicted_class,
                'created_at': prediction.created_at.isoformat()
            }
            
            # Re-generate attention and recommendations for this scan
            try:
                detector = CariesDetector()
                result = detector.predict(
                    scan.image.path,
                    return_attention=True,
                    return_recommendations=True
                )
                
                if result['success']:
                    attention_heatmap = result.get('attention_heatmap')
                    recommendations = result.get('recommendations')
            except Exception as e:
                print(f"Error generating attention/recommendations: {e}")
                # Continue without attention/recommendations
            
        except Prediction.DoesNotExist:
            prediction_data = None
        
        # Build absolute URL for image
        image_url = None
        if scan.image:
            image_url = request.build_absolute_uri(scan.image.url)
        
        response_data = {
            'xray': {
                'id': scan.id,
                'patient_id': scan.patient.id,
                'patient_name': f"{scan.patient.first_name} {scan.patient.last_name}",
                'uploaded_at': scan.uploaded_at.isoformat(),
                'image_type': scan.image_type,
                'tooth_region': scan.tooth_region,
                'notes': scan.notes,
                'image_url': image_url
            },
            'prediction': prediction_data
        }
        
        # Add explainability if available
        if attention_heatmap:
            response_data['explainability'] = {
                'attention_heatmap': attention_heatmap,
                'visualization_type': 'attention_rollout',
                'description': 'Heatmap shows areas the AI focused on. Warmer colors (red/yellow) indicate higher attention.'
            }
        
        # Add recommendations if available
        if recommendations:
            response_data['recommendations'] = recommendations
        
        return Response(response_data)
        
    except XRayImage.DoesNotExist:
        return Response(
            {'error': 'Scan not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to load scan details: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )