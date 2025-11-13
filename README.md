# Tunzadent — AI-Powered Dental Caries Detection System

## Overview
Tunzadent is a web-based clinical support system designed to assist dentists in detecting dental caries (tooth decay) from bitewing radiographs using deep learning.  
The system integrates a **Masked Autoencoder (MAE)** for self-supervised pre-training and a **Vision Transformer (ViT)** for fine-tuned binary classification of dental images.  

Through a two-stage training pipeline—self-supervised learning on **16,826 unlabeled tooth images** and fine-tuning on **624 labeled bitewing X-rays**—the model achieves **90.67% accuracy** on test data.

---

## Model Performance

| Metric | Score |
|---------|--------|
| Accuracy | 90.67% |
| Precision | 90.24% |
| Recall (Sensitivity) | 92.50% |
| Specificity | 88.57% |
| F1-Score | 0.9136 |
| AUC-ROC | 0.9657 |

---

## Technology Stack

### Frontend
- **Framework:** React 19  
- **Language:** JavaScript   
- **UI Library:** Material UI / Tailwind CSS  
- **State Management:** Context API / Redux  
- **HTTP Client:** Axios  
- **Routing:** React Router  

### Backend
- **Framework:** Django 4.2.7  
- **API:** Django REST Framework  
- **Authentication:** JWT (djangorestframework-simplejwt)  
- **Two-Factor Authentication:** pyotp (TOTP)  
- **CORS:** django-cors-headers  
- **Database:** MySQL 8.0  

### Machine Learning
- **Framework:** PyTorch 2.0+  
- **Vision Library:** timm (PyTorch Image Models)  
- **Architecture:** MAE (Masked Autoencoder) + Vision Transformer  
- **Pre-training Dataset:** 16,826 unlabeled tooth images  
- **Fine-tuning Dataset:** 624 labeled bitewing X-rays  

---

## Quick Start

### Prerequisites
Ensure the following are installed:
- Python 3.10 or higher  
- Node.js 18 or higher  
- MySQL 8.0  
- Git  

### 1. Clone the Repository
```bash
git clone https://github.com/is-project-4th-year/tunzadent.git
cd tunzadent
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Database Setup
```sql
CREATE DATABASE tunzadent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tunzadent_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON tunzadent.* TO 'tunzadent_user'@'localhost';
FLUSH PRIVILEGES;
```

Update your credentials in `backend/tunzadent/settings.py`.

```bash
# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

#### Model Weights
Place the trained model file in:
```
backend/ml_models/best_caries_classifier_v2.pth
```

#### Run Development Server
```bash
python manage.py runserver
```

Backend runs at: [http://localhost:8000](http://localhost:8000)

---

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create environment variable
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env

npm start
```

Frontend runs at: [http://localhost:3000](http://localhost:3000)

---

## Usage

### 1. User Registration & Authentication
- Register by providing user details.  
- Verify your email via the link sent to your inbox.  
- Set up Two-Factor Authentication (2FA) by scanning the QR code in Google Authenticator.  
- Save backup codes securely.  
- Log in using your credentials and 6-digit TOTP code.  

### 2. Patient Management
- Navigate to **Manage Patients**.  
- Create, view, update, or delete patient records.  
- Each record includes:  
  - Patient ID  
  - Name, gender, date of birth  
  - Number of scans and notes  

### 3. Upload Radiographs & Run Analysis
- Select an existing patient.  
- Upload one or multiple bitewing X-rays (JPEG/PNG).  
- Specify image type, tooth region, and notes (optional).  
- Click **Analyze** to run AI inference.  

**Results Displayed:**
- Caries/No Caries prediction  
- Confidence scores  
- Attention heatmap visualization  

### 4. Review Predictions
- View detailed reports with confidence scores, annotated regions, and AI-driven recommendations.  
- Export reports as PDF or CSV files.  

---

## Project Structure

```
tunzadent/
├── backend/
│   ├── accounts/                 # User management, authentication, 2FA
│   ├── predictions/              # Core ML functions
│   ├── ml_models/                # Trained model weights
│   ├── media/xrays/              # Uploaded X-ray images
│   ├── tunzadent/                # Django project settings & routing
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/           # React components 
│   │   ├── context/              # Global context management
│   │   ├── services/             # API service functions
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
├── docs/                         # Documentation files
├── .gitignore
├── README.md
└── requirements.txt
```

---

## Model Architecture

### Phase 1: Pre-training (MAE)
**Dataset:** 16,826 unlabeled tooth images (Kaggle)

**Architecture:**
- Input: 224×224 RGB  
- Patch size: 16×16 (196 patches)  
- Mask ratio: 75%  
- Encoder: 12-layer ViT (768-dim, 12 heads)  
- Decoder: 8-layer transformer (512-dim, 16 heads)

**Training Parameters:**
- Epochs: 100  
- Batch size: 32  
- Loss: MSE on masked patches  
- Purpose: Learn general dental structural representations  

---

### Phase 2: Fine-tuning (Classification)
**Dataset:** 624 labeled bitewing X-rays (Roboflow)

**Splits:**
- Train: 474  
- Validation: 75  
- Test: 75  

**Architecture:**
- Backbone: MAE encoder  
- Classifier: 3-layer MLP (768→512→256→2)  
- Loss: Weighted Cross-Entropy  
- Optimizer: AdamW (lr=1e-4)  
- Best Epoch: 36 / 50  

**Inference:**
- Input: 224×224 normalized X-ray  
- Output: Binary prediction + confidence  

---

## License
This project is licensed under the **MIT License**.

---

## Acknowledgments

### Datasets
- **Kaggle:** `tooth-number01` — Pre-training dataset  
- **Roboflow:** `bitewing-3my0p` — Fine-tuning dataset  

### Frameworks and Libraries
- Django & Django REST Framework  
- PyTorch & timm  
- React & Material UI  
