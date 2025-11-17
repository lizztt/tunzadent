import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { predictionService } from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await predictionService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Tunzadent</h1>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/settings')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Settings
              </button>
              <div className="text-sm text-gray-600">
                {user?.role === 'dentist' && 'Dr. '}{user?.first_name || user?.username}
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your practice activities
          </p>
        </div>

        {/* Statistics Grid - SIMPLIFIED */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Total Analyses */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-5">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Total Analyses
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.total_predictions || 0}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Radiographic scans processed
              </div>
            </div>
          </div>

          {/* Cases with Findings - SIMPLIFIED */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-5">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Cases with Findings
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.with_caries || 0}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Scans requiring attention
              </div>
            </div>
          </div>

          {/* Total Patients - NEW */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-5">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Total Patients
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.total_patients || 0}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Registered patient records
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  New Analysis
                </h3>
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Upload and analyze dental radiographs with AI-powered caries detection
              </p>
              
              {/* Two upload options */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/upload')}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Single Image
                </button>
                
                <button
                  onClick={() => navigate('/bulk-upload')}
                  className="w-full px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Multiple Images
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/patients')}
            className="bg-white border border-gray-200 hover:border-gray-300 text-left transition-colors"
          >
            <div className="px-6 py-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Patient Management
                </h3>
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                View and manage patient records, scan history, and diagnostic reports
              </p>
              <div className="mt-6 inline-flex items-center text-sm font-medium text-blue-600">
                Manage patients
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;