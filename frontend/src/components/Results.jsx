import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { predictionService } from '../services/api';
import toast from 'react-hot-toast';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { scanId } = useParams();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadScanDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await predictionService.getScanDetails(scanId);
      setData(response.data);
    } catch (error) {
      console.error('Error loading scan:', error);
      toast.error('Failed to load scan details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [scanId, navigate]);

  useEffect(() => {
    if (scanId) {
      loadScanDetails();
    } else if (location.state?.prediction) {
      setData(location.state.prediction);
    } else if (location.state?.data) {
      setData(location.state.data);
    } else {
      toast.error('No scan data available');
      navigate('/dashboard');
    }
  }, [scanId, location.state, navigate, loadScanDetails]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  const { xray, prediction, explainability, recommendations } = data;

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
              onClick={() => window.print()}
              className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50"
            >
              Export Report
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Patient & Scan Info Bar */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Analysis Report</h1>
          </div>
          <div className="px-6 py-4 grid grid-cols-4 gap-6 text-sm">
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Patient</div>
              <div className="font-medium text-gray-900">{xray.patient_name}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Scan Date</div>
              <div className="font-medium text-gray-900">
                {new Date(xray.uploaded_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Image Type</div>
              <div className="font-medium text-gray-900">{xray.image_type || 'Bitewing'}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Region</div>
              <div className="font-medium text-gray-900">{xray.tooth_region || 'Not specified'}</div>
            </div>
          </div>
        </div>

        {prediction && (
          <>
            {/* Diagnostic Summary - SIMPLIFIED */}
            <div className="bg-white border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Results</h2>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-3 h-3 rounded-full ${
                        prediction.has_caries ? 'bg-red-500' : 'bg-green-500'
                      }`}></div>
                      <span className="text-2xl font-semibold text-gray-900">
                        {prediction.has_caries ? 'Caries Detected' : 'No Caries Detected'}
                      </span>
                    </div>
                    <div className="mt-6">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Confidence Level</div>
                        <div className="text-3xl font-bold text-gray-900">
                          {prediction.confidence_score >= 0.9 ? 'Very High' :
                           prediction.confidence_score >= 0.75 ? 'High' :
                           prediction.confidence_score >= 0.6 ? 'Moderate' : 'Low'}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {(prediction.confidence_score * 100).toFixed(1)}% confidence
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation - SIMPLIFIED */}
            <div className="bg-white border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                      activeTab === 'overview'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  {explainability && explainability.attention_heatmap && (
                    <button
                      onClick={() => setActiveTab('visualization')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 ${
                        activeTab === 'visualization'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      AI Visualization
                    </button>
                  )}
                  {recommendations && (
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 ${
                        activeTab === 'recommendations'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Recommendations
                    </button>
                  )}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab - SIMPLIFIED */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                        Analysis Summary
                      </h3>
                      <div className="bg-gray-50 border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <tbody className="divide-y divide-gray-200">
                            <tr>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 w-1/3">
                                Finding
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {prediction.has_caries 
                                  ? 'Dental caries detected in the radiograph' 
                                  : 'No caries detected in the radiograph'}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                Confidence Level
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {prediction.confidence_score >= 0.9 ? 'Very High' :
                                 prediction.confidence_score >= 0.75 ? 'High' :
                                 prediction.confidence_score >= 0.6 ? 'Moderate' : 'Low'}
                                {' '}({(prediction.confidence_score * 100).toFixed(1)}%)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {xray.notes && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                          Notes
                        </h3>
                        <div className="bg-gray-50 border border-gray-200 px-6 py-4 text-sm text-gray-700">
                          {xray.notes}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Visualization Tab */}
                {activeTab === 'visualization' && explainability && explainability.attention_heatmap && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                        AI Analysis Visualization
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        {explainability.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3">
                          Original Image
                        </div>
                        <div className="h-96 bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <img 
                            src={xray.image_url} 
                            alt="Original X-Ray" 
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3">
                          Areas of Interest
                        </div>
                        <div className="relative h-96 bg-black border border-gray-200 flex items-center justify-center">
                          <img 
                            src={`data:image/png;base64,${explainability.attention_heatmap}`}
                            alt="Attention Heatmap" 
                            className="max-h-full max-w-full object-contain"
                          />
                          <div className="absolute bottom-3 right-3 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                            Red = High Priority
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && recommendations && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold ${
                        recommendations.urgency_level === 'high' ? 'bg-red-100 text-red-800' :
                        recommendations.urgency_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {recommendations.severity}
                      </span>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        Priority: {recommendations.urgency_level}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                        Recommended Actions
                      </h3>
                      <ul className="space-y-2">
                        {recommendations.clinical_actions.map((action, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <span className="inline-block w-6 h-6 mr-3 mt-0.5 flex-shrink-0 text-center text-xs font-medium text-gray-500 bg-gray-100 rounded-full leading-6">
                              {index + 1}
                            </span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                        Patient Instructions
                      </h3>
                      <ul className="space-y-2">
                        {recommendations.patient_advice.map((advice, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <span className="inline-block w-1.5 h-1.5 mr-3 mt-2 flex-shrink-0 bg-blue-500 rounded-full"></span>
                            <span>{advice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 px-6 py-4">
                      <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">
                        Follow-Up Schedule
                      </div>
                      <div className="text-sm text-blue-800">{recommendations.follow_up}</div>
                    </div>

                    {recommendations.risk_factors && recommendations.risk_factors.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                          Risk Factors
                        </h3>
                        <ul className="space-y-2">
                          {recommendations.risk_factors.map((factor, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-700">
                              <span className="inline-block w-1.5 h-1.5 mr-3 mt-2 flex-shrink-0 bg-amber-500 rounded-full"></span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 px-6 py-4">
                      <div className="text-xs text-amber-800">
                        {recommendations.disclaimer}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/upload')}
            className="px-6 py-3 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            New Analysis
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;