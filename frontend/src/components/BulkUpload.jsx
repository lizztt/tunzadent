import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService, predictionService } from '../services/api';
import toast from 'react-hot-toast';

const BulkUpload = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data);
    } catch (error) {
      toast.error('Failed to load patients');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image format`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    
    setFiles(validFiles);
    setProgress(validFiles.map(() => ({ status: 'pending', message: 'Waiting...' })));
  };

  const handleBulkUpload = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }
    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setUploading(true);
    const uploadResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update progress
      setProgress(prev => prev.map((p, idx) => 
        idx === i ? { status: 'uploading', message: 'Uploading...' } : p
      ));

      try {
        // Upload and analyze
        const formData = new FormData();
        formData.append('image', file);
        formData.append('patient_id', selectedPatient);
        formData.append('image_type', 'bitewing');

        const response = await predictionService.uploadAndPredict(formData);
        
        uploadResults.push({
          filename: file.name,
          success: true,
          data: response.data
        });

        setProgress(prev => prev.map((p, idx) => 
          idx === i ? { status: 'completed', message: 'Completed ✓' } : p
        ));

      } catch (error) {
        uploadResults.push({
          filename: file.name,
          success: false,
          error: error.response?.data?.detail || 'Upload failed'
        });

        setProgress(prev => prev.map((p, idx) => 
          idx === i ? { status: 'error', message: 'Failed ✗' } : p
        ));
      }
    }

    setResults(uploadResults);
    setUploading(false);
    
    const successCount = uploadResults.filter(r => r.success).length;
    const failCount = uploadResults.filter(r => !r.success).length;
    
    if (successCount > 0) {
      toast.success(`${successCount} scan(s) analyzed successfully!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} scan(s) failed`);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setProgress([]);
    setResults([]);
    setSelectedPatient('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'uploading': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
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
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Bulk Analysis</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload and analyze multiple X-ray images at once
          </p>
        </div>

        {/* Patient Selection */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Select Patient
            </h3>
          </div>
          <div className="px-6 py-6">
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              disabled={uploading}
              className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.patient_id} - {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">
                No patients found. <button onClick={() => navigate('/patients')} className="text-blue-600 hover:text-blue-800">Create a patient first</button>
              </p>
            )}
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Upload X-Ray Images
            </h3>
          </div>
          <div className="px-6 py-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
                id="bulk-file-input"
              />
              <label 
                htmlFor="bulk-file-input" 
                className="cursor-pointer"
              >
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Click to select multiple images or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, JPEG up to 10MB each
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-900">
                    {files.length} image(s) selected
                  </p>
                  {!uploading && (
                    <button
                      onClick={clearAll}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded border border-gray-200">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      {progress[index] && (
                        <span className={`text-sm font-medium ml-4 ${getStatusColor(progress[index].status)}`}>
                          {progress[index].message}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={handleBulkUpload}
            disabled={uploading || !selectedPatient || files.length === 0}
            className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing ({progress.filter(p => p.status === 'completed').length}/{files.length})
              </span>
            ) : (
              `Analyze ${files.length} Image${files.length !== 1 ? 's' : ''}`
            )}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            disabled={uploading}
            className="px-6 py-3 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Analysis Results
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {results.map((result, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.filename}
                      </p>
                      {result.success ? (
                        <p className="text-sm text-gray-600 mt-1">
                          {result.data.prediction.has_caries ? (
                            <span className="text-red-600 font-medium">Caries Detected</span>
                          ) : (
                            <span className="text-green-600 font-medium">No Caries</span>
                          )}
                          {' '}• Confidence: {(result.data.prediction.confidence_score * 100).toFixed(1)}%
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                    {result.success && (
                      <button
                        onClick={() => navigate(`/results/${result.data.xray.id}`)}
                        className="ml-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => navigate('/patients')}
                className="w-full px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                View All Patient Records
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;