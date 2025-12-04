import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import timm
import time
import numpy as np
from matplotlib import cm
import io
import base64
from pathlib import Path
from django.conf import settings

# ============================================
# Model Architecture with Attention Support
# ============================================

class PatchEmbed(nn.Module):
    """Image to Patch Embedding"""
    def __init__(self, img_size=224, patch_size=16, in_chans=3, embed_dim=768):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.n_patches = (img_size // patch_size) ** 2
        self.proj = nn.Conv2d(in_chans, embed_dim, 
                             kernel_size=patch_size, stride=patch_size)
    
    def forward(self, x):
        x = self.proj(x)
        x = x.flatten(2)
        x = x.transpose(1, 2)
        return x


class CariesClassifier(nn.Module):
    """Caries classification model with attention extraction - 90.67% accuracy!"""
    
    def __init__(self, checkpoint_path, num_classes=2):
        super().__init__()
        
        checkpoint = torch.load(checkpoint_path, map_location='cpu')
        
        # Default config matching  training setup
        default_config = {
            'img_size': 224,
            'patch_size': 16,
            'embed_dim': 768,
            'depth': 12,
            'num_heads': 12,
            'mlp_ratio': 4.0,
        }
        
        # Use checkpoint config if available
        if 'config' in checkpoint:
            config = {**default_config, **checkpoint['config']}
        else:
            config = default_config
            print("No config found in checkpoint, using defaults")
        
        self.patch_embed = PatchEmbed(
            config['img_size'], config['patch_size'], 3, config['embed_dim']
        )
        self.cls_token = nn.Parameter(torch.zeros(1, 1, config['embed_dim']))
        self.pos_embed = nn.Parameter(
            torch.zeros(1, 1 + self.patch_embed.n_patches, config['embed_dim'])
        )
        
        self.encoder = nn.ModuleList([
            timm.models.vision_transformer.Block(
                config['embed_dim'], config['num_heads'], 
                config['mlp_ratio'], qkv_bias=True, norm_layer=nn.LayerNorm
            ) for _ in range(config['depth'])
        ])
        self.encoder_norm = nn.LayerNorm(config['embed_dim'])
        
        self.head = nn.Sequential(
            nn.Linear(config['embed_dim'], 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )
        
        # Storage for attention maps
        self.attention_maps = []
        
        # Load weights
        try:
            self.load_state_dict(checkpoint['model_state_dict'], strict=False)
            print("Model weights loaded successfully")
        except Exception as e:
            print(f"Warning loading weights: {e}")
        
        self.eval()
    
    def _forward_with_attention(self, block, x):
        """Forward through a block while capturing attention weights"""
        shortcut = x
        x = block.norm1(x)
        
        # Manually compute attention
        B, N, C = x.shape
        qkv = block.attn.qkv(x).reshape(B, N, 3, block.attn.num_heads, C // block.attn.num_heads).permute(2, 0, 3, 1, 4)
        q, k, v = qkv.unbind(0)
        
        # Compute attention weights
        attn = (q @ k.transpose(-2, -1)) * block.attn.scale
        attn = attn.softmax(dim=-1)
        attn_weights = attn.detach()  # Save for return
        
        # Apply dropout and compute output
        attn = block.attn.attn_drop(attn)
        x = (attn @ v).transpose(1, 2).reshape(B, N, C)
        x = block.attn.proj(x)
        x = block.attn.proj_drop(x)
        
        # Residual connection
        x = shortcut + block.drop_path1(block.ls1(x))
        
        # FFN
        x = x + block.drop_path2(block.ls2(block.mlp(block.norm2(x))))
        
        return x, attn_weights
    
    def forward(self, x, return_attention=False):
        """
        Forward pass with optional attention extraction
        
        Args:
            x: Input tensor [B, 3, H, W]
            return_attention: If True, returns (logits, attention_weights)
        
        Returns:
            logits: [B, num_classes]
            attention (optional): [B, heads, patches, patches]
        """
        if return_attention:
            self.attention_maps = []
        
        # Patch embedding
        x = self.patch_embed(x)
        x = x + self.pos_embed[:, 1:, :]
        
        # Add CLS token
        cls_tokens = self.cls_token.expand(x.shape[0], -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        
        # Encoder with optional attention capture
        for block_idx, blk in enumerate(self.encoder):
            if return_attention and block_idx == len(self.encoder) - 1:
                # Capture attention from last block
                x, attn = self._forward_with_attention(blk, x)
                self.attention_maps.append(attn)
            else:
                x = blk(x)
        
        x = self.encoder_norm(x)
        
        # Classification
        cls_output = x[:, 0]
        logits = self.head(cls_output)
        
        if return_attention:
            attention = self.attention_maps[-1] if self.attention_maps else None
            return logits, attention
        
        return logits


# ============================================
# Helper Functions
# ============================================

def generate_attention_heatmap(model, image_tensor, device):
    """
    Generate attention heatmap as base64 encoded image
    
    Args:
        model: CariesClassifier instance
        image_tensor: Preprocessed image tensor [1, 3, 224, 224]
        device: torch device
    
    Returns:
        str: Base64 encoded PNG image of attention heatmap
    """
    model.eval()
    
    with torch.no_grad():
        logits, attention = model(image_tensor, return_attention=True)
    
    if attention is None:
        return None
    
    # Process attention: [batch, heads, patches, patches]
    attention = attention[0]  # Remove batch dimension
    attention = attention.mean(dim=0)  # Average across attention heads
    
    # Get CLS token attention to all other patches
    cls_attention = attention[0, 1:]  # Skip CLS token itself
    
    # Reshape to 2D grid (14x14 for 224x224 image with 16x16 patches)
    grid_size = int(np.sqrt(cls_attention.shape[0]))
    attention_map = cls_attention.reshape(grid_size, grid_size).cpu().numpy()
    
    # Normalize to [0, 1]
    attention_map = (attention_map - attention_map.min()) / (attention_map.max() - attention_map.min() + 1e-8)
    
    # Resize to 224x224
    attention_pil = Image.fromarray((attention_map * 255).astype(np.uint8))
    attention_pil = attention_pil.resize((224, 224), Image.BILINEAR)
    attention_array = np.array(attention_pil) / 255.0
    
    # Apply jet colormap
    colored_heatmap = cm.jet(attention_array)[:, :, :3]
    
    # Convert to PIL and encode as base64
    heatmap_pil = Image.fromarray((colored_heatmap * 255).astype(np.uint8))
    buffer = io.BytesIO()
    heatmap_pil.save(buffer, format='PNG')
    heatmap_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return heatmap_base64


def generate_recommendations(prediction_data):
    """
    Generate clinical recommendations based on prediction results
    
    Args:
        prediction_data: Dict with 'has_caries' and 'confidence_score'
    
    Returns:
        dict: Structured recommendations for clinician and patient
    """
    has_caries = prediction_data['has_caries']
    confidence = prediction_data['confidence_score']
    
    recommendations = {
        'severity': None,
        'clinical_actions': [],
        'patient_advice': [],
        'follow_up': None,
        'urgency_level': 'low',
        'disclaimer': (
            'This AI analysis is a diagnostic aid and should not replace professional clinical judgment. '
            'Always perform thorough clinical examination and consider patient history before treatment decisions.'
        )
    }
    
    if has_caries:
        if confidence >= 0.90:
            recommendations.update({
                'severity': 'High Confidence Caries Detection',
                'urgency_level': 'high',
                'clinical_actions': [
                    'Perform thorough clinical examination of the affected area',
                    'Consider additional radiographs from different angles for depth assessment',
                    'Assess cavity depth and proximity to pulp chamber',
                    'Plan for restorative treatment (composite filling or appropriate restoration)',
                    'Check for caries in adjacent teeth and assess overall caries risk'
                ],
                'patient_advice': [
                    'Schedule treatment appointment within 1-2 weeks to prevent progression',
                    'Avoid sticky or sugary foods on the affected side',
                    'Maintain rigorous oral hygiene with twice-daily brushing',
                    'Use fluoride toothpaste and consider fluoride mouthwash',
                    'Consider sensitivity toothpaste if experiencing discomfort'
                ],
                'follow_up': 'Schedule treatment immediately. Plan follow-up X-ray 6 months after restoration to ensure success.'
            })
        elif confidence >= 0.70:
            recommendations.update({
                'severity': 'Moderate Confidence Caries Detection',
                'urgency_level': 'medium',
                'clinical_actions': [
                    'Perform detailed visual and tactile examination',
                    'Consider additional diagnostic tests (transillumination, laser fluorescence)',
                    'Monitor closely if early-stage caries without cavitation',
                    'Assess patient caries risk factors (diet, oral hygiene, fluoride exposure)',
                    'Consider preventive measures versus immediate intervention'
                ],
                'patient_advice': [
                    'Schedule appointment within 2-4 weeks for thorough examination',
                    'Increase brushing frequency to twice daily with proper technique',
                    'Use fluoride mouthwash daily',
                    'Reduce frequency of sugar and acidic food/drink consumption',
                    'Consider dental sealants for at-risk teeth'
                ],
                'follow_up': 'Re-evaluate in 3-6 months with follow-up X-ray if monitoring approach is chosen.'
            })
        else:
            recommendations.update({
                'severity': 'Possible Early-Stage Caries',
                'urgency_level': 'low',
                'clinical_actions': [
                    'Perform careful clinical examination for early signs',
                    'Look for white spot lesions, surface roughness, or staining',
                    'Consider remineralization therapy with high-fluoride products',
                    'Assess patient oral hygiene practices and dietary habits',
                    'May monitor before intervention if very early stage'
                ],
                'patient_advice': [
                    'Enhance oral hygiene routine with proper brushing technique',
                    'Use high-fluoride toothpaste (1450ppm or prescription strength)',
                    'Increase flossing frequency to daily',
                    'Reduce acidic and sugary food/drink consumption between meals',
                    'Consider calcium and phosphate supplements for remineralization'
                ],
                'follow_up': 'Monitor with follow-up X-ray in 6-12 months. Focus on prevention and remineralization.'
            })
    else:
        if confidence >= 0.85:
            recommendations.update({
                'severity': 'Healthy - No Caries Detected',
                'urgency_level': 'low',
                'clinical_actions': [
                    'Confirm with visual examination during routine check-up',
                    'Continue routine preventive care and monitoring',
                    'Reinforce good oral hygiene practices',
                    'Schedule regular check-ups as per standard protocol'
                ],
                'patient_advice': [
                    'Maintain current oral hygiene routine',
                    'Continue brushing twice daily for 2 minutes',
                    'Floss daily to prevent interproximal caries',
                    'Attend regular dental check-ups every 6 months',
                    'Continue balanced diet with limited sugar intake'
                ],
                'follow_up': 'Routine check-up and X-ray as per standard recall interval (typically 6-12 months).'
            })
        else:
            recommendations.update({
                'severity': 'Uncertain - Further Examination Recommended',
                'urgency_level': 'medium',
                'clinical_actions': [
                    'Perform thorough clinical examination',
                    'Consider retaking X-ray if image quality is suboptimal',
                    'Check for borderline lesions or incipient caries',
                    'Assess overall caries risk and preventive needs'
                ],
                'patient_advice': [
                    'Schedule follow-up examination within 3-4 months',
                    'Maintain preventive care routine',
                    'Monitor for any tooth sensitivity or discomfort',
                    'Report any changes in symptoms promptly'
                ],
                'follow_up': 'Clinical follow-up in 3-4 months with repeat radiograph if indicated.'
            })
    
    return recommendations


# ============================================
# Main Detector Class
# ============================================

class CariesDetector:
    """
    Singleton class for caries detection with attention visualization
    
    Model Performance:
    - Accuracy: 90.67%
    - Sensitivity: 92.50%
    - Specificity: 88.57%
    - AUC-ROC: 96.57%
    """
    
    _instance = None
    _model = None
    _device = None
    _transform = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize model and transforms"""
        self._device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        model_paths = [
            Path(settings.BASE_DIR) / 'ml_models' / 'best_caries_classifier_v2.pth'
        ]
        
        model_path = None
        for path in model_paths:
            if path.exists():
                model_path = path
                break
        
        if model_path is None:
            raise FileNotFoundError(
                f"Model not found. Please place model file in: "
                f"{Path(settings.BASE_DIR) / 'ml_models'}"
            )
        
        print(f"Loading caries detection model from {model_path.name} on {self._device}")
        self._model = CariesClassifier(str(model_path))
        self._model.to(self._device)
        self._model.eval()
        print("Model loaded successfully! Ready for predictions with attention visualization.")
        
        # Same transforms used during training
        self._transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    def predict(self, image_path, return_attention=False, return_recommendations=True):
        """
        Predict caries from X-ray image with optional attention and recommendations
        
        Args:
            image_path: Path to X-ray image
            return_attention: If True, generates attention heatmap
            return_recommendations: If True, generates clinical recommendations
        
        Returns:
            dict: Comprehensive prediction results including:
                - has_caries: bool
                - confidence_score: float
                - confidence_no_caries: float
                - confidence_has_caries: float
                - predicted_class: int
                - processing_time_ms: float
                - attention_heatmap: str (base64) if return_attention=True
                - recommendations: dict if return_recommendations=True
                - success: bool
        """
        start_time = time.time()
        
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            img_tensor = self._transform(image).unsqueeze(0).to(self._device)
            
            # Prediction
            with torch.no_grad():
                if return_attention:
                    logits, attention = self._model(img_tensor, return_attention=True)
                else:
                    logits = self._model(img_tensor, return_attention=False)
                    attention = None
                
                probs = torch.softmax(logits, dim=1)[0]
                predicted_class = logits.argmax(dim=1).item()
            
            conf_no_caries = probs[0].item()
            conf_has_caries = probs[1].item()
            processing_time = (time.time() - start_time) * 1000
            
            # Build result
            result = {
                'has_caries': bool(predicted_class == 1),
                'confidence_score': max(conf_no_caries, conf_has_caries),
                'confidence_no_caries': conf_no_caries,
                'confidence_has_caries': conf_has_caries,
                'predicted_class': predicted_class,
                'processing_time_ms': round(processing_time, 2),
                'model_version': 'MAE-ViT-v2.0',
                'success': True
            }
            
            # Generate attention heatmap if requested
            if return_attention and attention is not None:
                heatmap = generate_attention_heatmap(self._model, img_tensor, self._device)
                result['attention_heatmap'] = heatmap
            
            # Generate recommendations if requested
            if return_recommendations:
                recommendations = generate_recommendations(result)
                result['recommendations'] = recommendations
            
            return result
            
        except Exception as e:
            print(f"Prediction error: {e}")
            return {
                'success': False,
                'error': str(e)
            }