import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;

      if (!token) {
        setStatus('error');
        toast.error('Invalid verification link', { duration: 6000 });
        return;
      }

      try {
        await authService.verifyEmail(token);
        
        setStatus('success');
        toast.success('Email verified successfully', { duration: 5000 });
      } catch (error) {
        setStatus('error');
        const errorMsg = error.response?.data?.error || 
                        error.response?.data?.detail || 
                        'Verification failed - Token may be invalid or expired';
        toast.error(errorMsg, { duration: 6000 });
      }
    };

    verifyEmail();
  }, [token]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Tunzadent</h1>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-600">Email Verification</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-white border border-gray-200">
          {status === 'verifying' && (
            <>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Email Verification In Progress
                </h2>
              </div>
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Verifying Email Address
                </h3>
                <p className="text-sm text-gray-600">
                  Please wait while we verify your email address
                </p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                <h2 className="text-sm font-semibold text-green-900 uppercase tracking-wide">
                  Email Verification Successful
                </h2>
              </div>
              <div className="px-6 py-8">
                <div className="text-center mb-8">
                  <div className="mb-6">
                    <svg 
                      className="w-16 h-16 mx-auto text-green-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Email Address Verified
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Your email has been successfully verified.
                  </p>
                  <p className="text-sm text-gray-600">
                    You can now log in to your Tunzadent account and complete the security setup.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 px-6 py-4 mb-6">
                  <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">
                    Next Steps
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-blue-600 rounded-full"></span>
                      <span>Log in to your account using your credentials</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-blue-600 rounded-full"></span>
                      <span>Complete two-factor authentication setup</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-blue-600 rounded-full"></span>
                      <span>Begin using the diagnostic platform</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleGoToLogin}
                  className="w-full px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Login
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                <h2 className="text-sm font-semibold text-red-900 uppercase tracking-wide">
                  Email Verification Failed
                </h2>
              </div>
              <div className="px-6 py-8">
                <div className="text-center mb-8">
                  <div className="mb-6">
                    <svg 
                      className="w-16 h-16 mx-auto text-red-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Verification Failed
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    The verification link is invalid or has expired.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 px-6 py-4 mb-6">
                  <h4 className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-2">
                    Common Issues
                  </h4>
                  <ul className="space-y-2 text-sm text-amber-800">
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-amber-600 rounded-full"></span>
                      <span>Verification links expire after 24 hours for security</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-amber-600 rounded-full"></span>
                      <span>The link may have been used already</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-amber-600 rounded-full"></span>
                      <span>The email address may have been verified previously</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Login
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full px-6 py-3 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Register New Account
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Need Assistance?
            </h3>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600 mb-3">
              If you continue experiencing issues with email verification, please contact support:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-gray-400 rounded-full"></span>
                <span>Check your spam or junk folder for the verification email</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-gray-400 rounded-full"></span>
                <span>Ensure you clicked the most recent verification link sent</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-gray-400 rounded-full"></span>
                <span>Contact your system administrator for additional support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;