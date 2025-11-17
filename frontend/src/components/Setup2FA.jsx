import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Setup2FA() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  const { username, password, user_id } = location.state || {};

  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);

  const fetchQRCode = useCallback(async () => {
    try {
      const response = await authService.setup2FA({
        username,
        password,
        user_id
      });

      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setSetupLoading(false);
    } catch (error) {
      toast.error('Failed to generate 2FA setup');
      navigate('/login');
    }
  }, [username, password, user_id, navigate]);

  useEffect(() => {
    if (!username || !password || !user_id) {
      toast.error('Invalid session. Please login again.');
      navigate('/login');
      return;
    }
    
    fetchQRCode();
  }, [fetchQRCode, username, password, user_id, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (token.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.complete2FA({
        username,
        password,
        user_id,
        token
      });

      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      updateUser(response.data.user);

      setBackupCodes(response.data.backup_codes);
      setShowBackupCodes(true);
      toast.success('Two-factor authentication enabled successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid verification code');
      setToken('');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  const handleDownloadBackupCodes = () => {
    const text = `Tunzadent - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\nIMPORTANT: Keep these codes in a secure location.\nEach code can only be used once.\n\n${backupCodes.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tunzadent-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  if (setupLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Initializing two-factor authentication...</p>
        </div>
      </div>
    );
  }

  if (showBackupCodes) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Tunzadent</h1>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <h2 className="text-lg font-semibold text-green-900">
                Two-Factor Authentication Enabled
              </h2>
            </div>

            <div className="px-6 py-6">
              <div className="bg-amber-50 border border-amber-200 px-6 py-4 mb-6">
                <h3 className="text-sm font-semibold text-amber-900 mb-2">
                  Important: Save Your Backup Codes
                </h3>
                <p className="text-sm text-amber-800">
                  Store these codes in a secure location. You can use them to access your account 
                  if you lose your authenticator device. Each code can only be used once.
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Backup Recovery Codes
                </h4>
                <div className="bg-gray-50 border border-gray-200 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {backupCodes.map((code, index) => (
                      <div 
                        key={index} 
                        className="bg-white border border-gray-300 px-4 py-3 font-mono text-sm text-gray-900 text-center"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleDownloadBackupCodes}
                  className="w-full px-6 py-3 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Download Backup Codes
                </button>
                <button
                  onClick={handleContinue}
                  className="w-full px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Dashboard
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  You can view and regenerate backup codes from your account settings at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Tunzadent</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Two-Factor Authentication Setup
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure additional security for your account
          </p>
        </div>

        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Setup Instructions
            </h3>
          </div>

          <div className="px-6 py-6">
            <div className="bg-blue-50 border border-blue-200 px-6 py-4 mb-6">
              <p className="text-sm text-blue-800">
                Two-factor authentication is required for all accounts to ensure the security 
                of patient data and comply with healthcare data protection standards.
              </p>
            </div>

            {/* Step 1: Scan QR Code */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Step 1: Configure Authenticator Application
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Use an authenticator application such as Google Authenticator, Microsoft Authenticator, 
                or Authy to scan the QR code below:
              </p>
              
              {qrCode && (
                <div className="bg-gray-50 border border-gray-200 p-8 flex justify-center mb-4">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 px-6 py-4">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Manual Entry Code
                </p>
                <div className="font-mono text-sm text-gray-900">
                  {secret}
                </div>
              </div>
            </div>

            {/* Step 2: Verify Code */}
            <form onSubmit={handleVerify}>
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Step 2: Enter Verification Code
                </h4>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  6-digit verification code
                </label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter the 6-digit code displayed in your authenticator application
                </p>
              </div>

              <div className="flex space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex-1 px-6 py-3 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || token.length !== 6}
                  className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying Code...' : 'Verify and Enable'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Help Information */}
        <div className="mt-6 bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Need Help?
            </h3>
          </div>
          <div className="px-6 py-4">
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-gray-400 rounded-full"></span>
                <span>Download a compatible authenticator app from your device's app store</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-gray-400 rounded-full"></span>
                <span>Ensure your device's time is synchronized for accurate code generation</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-gray-400 rounded-full"></span>
                <span>Save your backup codes in a secure location after setup is complete</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}