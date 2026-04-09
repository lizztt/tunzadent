import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService, predictionService } from '../services/api';
import toast from 'react-hot-toast';

const UploadXRay = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    image_type: 'bitewing',
    tooth_region: '',
    notes: '',
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select an X-ray image');
      return;
    }

    if (!formData.patient_id) {
      toast.error('Please select a patient');
      return;
    }

    setLoading(true);
    
    const submitData = new FormData();
    submitData.append('image', selectedFile);
    submitData.append('patient_id', formData.patient_id);
    submitData.append('image_type', formData.image_type);
    submitData.append('tooth_region', formData.tooth_region);
    submitData.append('notes', formData.notes);

    try {
      const response = await predictionService.uploadAndPredict(submitData);
      
      if (response.data && response.data.prediction) {
        const prediction = response.data.prediction;
        
        toast.success(
          prediction.has_caries 
            ? 'Caries detected - Analysis complete' 
            : 'No caries detected - Analysis complete',
          { duration: 4000 }
        );
        
        navigate('/results', { 
          state: { data: response.data } 
        });
      } else {
        toast.error('Analysis completed but results are incomplete');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.error || 'Invalid request - Please check your inputs');
      } else if (error.response?.status === 404) {
        toast.error('Patient not found - Please select a valid patient');
      } else if (error.response?.status === 500) {
        toast.error('Analysis failed - Please try again or contact support');
      } else if (error.message === 'Network Error') {
        toast.error('Network error - Please check your connection');
      } else {
        toast.error(error.response?.data?.error || 'Upload failed - Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-xl font-semibold text-gray-900"
              >
                Tunzadent
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/patients')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Manage Patients
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Upload Radiograph</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Patient Information
              </h3>
            </div>
            <div className="px-6 py-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Patient
              </label>
              <select
                required
                className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              >
                <option value="">Select a patient from records...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.patient_id} - {patient.first_name} {patient.last_name}
                  </option>
                ))}
              </select>
              
              {patients.length === 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 px-4 py-3">
                  <p className="text-sm text-yellow-800 mb-2">
                    No patient records found in the system.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/patients')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Add New Patient
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Radiograph Upload
              </h3>
            </div>
            <div className="px-6 py-6">
              {preview ? (
                <div className="space-y-4">
                  <div className="bg-gray-100 border border-gray-200 p-4">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="max-h-96 mx-auto object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">File:</span> {selectedFile?.name}
                    </div>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 transition-colors">
                  <label className="block cursor-pointer">
                    <div className="px-6 py-12 text-center">
                      <svg 
                        className="mx-auto h-12 w-12 text-gray-400" 
                        stroke="currentColor" 
                        fill="none" 
                        viewBox="0 0 48 48"
                      >
                        <path 
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                          strokeWidth={2} 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      </svg>
                      <div className="mt-4 text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                          Select file
                        </span>
                        {' '}or drag and drop
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG, JPEG up to 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Scan Details */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Scan Details
              </h3>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Type
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.image_type}
                    onChange={(e) => setFormData({ ...formData, image_type: e.target.value })}
                  >
                    <option value="bitewing">Bitewing</option>
                    <option value="periapical">Periapical</option>
                    <option value="panoramic">Panoramic</option>
                    <option value="occlusal">Occlusal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tooth Region
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Upper right molars"
                    value={formData.tooth_region}
                    onChange={(e) => setFormData({ ...formData, tooth_region: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinical Notes
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter any relevant clinical observations or patient symptoms..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-6 py-3 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile || !formData.patient_id}
              className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Analysis...
                </span>
              ) : (
                'Begin Analysis'
              )}
            </button>
          </div>
        </form>

        {/* Guidelines */}
        <div className="mt-8 bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Image Guidelines
            </h3>
          </div>
          <div className="px-6 py-4">
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-gray-400 rounded-full"></span>
                <span>Use high-resolution images for optimal analysis accuracy</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-gray-400 rounded-full"></span>
                <span>Ensure proper image orientation before upload</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-gray-400 rounded-full"></span>
                <span>Bitewing radiographs provide optimal results for caries detection</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-gray-400 rounded-full"></span>
                <span>Include relevant clinical context in the notes field</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadXRay;