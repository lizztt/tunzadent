import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  
  // Profile state
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA/Backup Codes state
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [regeneratingCodes, setRegeneratingCodes] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const response = await authService.updateProfile(profileData);
      updateUser(response.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error.response?.data);
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.detail || 
                       'Failed to update profile';
      toast.error(errorMsg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    // Enhanced password validation
    const hasUppercase = /[A-Z]/.test(passwordData.new_password);
    const hasLowercase = /[a-z]/.test(passwordData.new_password);
    const hasNumber = /[0-9]/.test(passwordData.new_password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new_password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      toast.error('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    setPasswordLoading(true);

    try {
      await authService.changePassword({
        old_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success('Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Password change error:', error.response?.data);
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.detail ||
                       'Failed to change password';
      toast.error(errorMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    if (!window.confirm('Regenerating backup codes will invalidate all existing codes. Continue?')) {
      return;
    }

    setRegeneratingCodes(true);
    try {
      const response = await authService.regenerateBackupCodes();
      setBackupCodes(response.data.backup_codes);
      setShowBackupCodes(true);
      toast.success('New backup codes generated successfully');
    } catch (error) {
      console.error('Backup codes regeneration error:', error.response?.data);
      toast.error('Failed to regenerate backup codes');
    } finally {
      setRegeneratingCodes(false);
    }
  };

  const downloadBackupCodes = () => {
    const text = `Tunzadent - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\nIMPORTANT: Keep these codes in a secure location.\nEach code can only be used once.\n\n${backupCodes.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tunzadent-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Account Settings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account preferences and security settings
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-1">
            <nav className="bg-white border border-gray-200">
              <button
                onClick={() => setActiveSection('profile')}
                className={`w-full text-left px-4 py-3 text-sm border-b border-gray-200 ${
                  activeSection === 'profile'
                    ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-l-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveSection('security')}
                className={`w-full text-left px-4 py-3 text-sm border-b border-gray-200 ${
                  activeSection === 'security'
                    ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-l-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveSection('2fa')}
                className={`w-full text-left px-4 py-3 text-sm ${
                  activeSection === '2fa'
                    ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-l-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Two-Factor Authentication
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="col-span-3">
            {/* Profile Information Section */}
            {activeSection === 'profile' && (
              <div className="bg-white border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Profile Information
                  </h3>
                </div>
                <form onSubmit={handleProfileUpdate} className="px-6 py-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 text-sm bg-gray-50"
                          value={user?.username || ''}
                          disabled
                        />
                        <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 text-sm bg-gray-50 capitalize"
                          value={user?.role || ''}
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {profileLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="bg-white border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Change Password
                  </h3>
                </div>
                <form onSubmit={handlePasswordChange} className="px-6 py-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Must contain: 8+ characters, uppercase, lowercase, number, and special character
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {passwordLoading ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Two-Factor Authentication Section */}
            {activeSection === '2fa' && (
              <div className="bg-white border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Two-Factor Authentication
                  </h3>
                </div>
                <div className="px-6 py-6">
                  {/* Current Status */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Status
                        </p>
                        <p className="text-xs text-gray-500">
                          Two-factor authentication is currently enabled for your account
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800">
                        ENABLED
                      </span>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-blue-50 border border-blue-200 px-6 py-4 mb-6">
                    <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">
                      Security Policy
                    </h4>
                    <p className="text-sm text-blue-800">
                      Two-factor authentication is mandatory for all accounts to ensure HIPAA compliance 
                      and protect sensitive patient data. This security measure cannot be disabled.
                    </p>
                  </div>

                  {/* Backup Codes Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Backup Recovery Codes
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Backup codes can be used to access your account if you lose your authenticator device. 
                      Each code can only be used once.
                    </p>

                    {!showBackupCodes ? (
                      <button
                        onClick={regenerateBackupCodes}
                        disabled={regeneratingCodes}
                        className="px-6 py-3 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {regeneratingCodes ? 'Generating New Codes...' : 'Regenerate Backup Codes'}
                      </button>
                    ) : (
                      <div>
                        <div className="bg-amber-50 border border-amber-200 px-6 py-4 mb-4">
                          <p className="text-sm text-amber-800 font-medium">
                            Save these codes immediately. They will not be shown again.
                          </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 p-6 mb-4">
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

                        <div className="flex space-x-4">
                          <button
                            onClick={downloadBackupCodes}
                            className="flex-1 px-6 py-3 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Download Codes
                          </button>
                          <button
                            onClick={() => setShowBackupCodes(false)}
                            className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                          >
                            I've Saved My Codes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Your New Backup Codes
              </h3>
              <button
                onClick={() => setShowBackupCodes(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="bg-amber-50 border border-amber-200 px-6 py-4 mb-6">
                <h4 className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-2">
                  Important
                </h4>
                <ul className="space-y-1 text-sm text-amber-800">
                  <li>• Save these codes in a secure location</li>
                  <li>• Each code can only be used once</li>
                  <li>• These codes have replaced your previous backup codes</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-6 mb-6">
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

              <div className="flex space-x-4">
                <button
                  onClick={downloadBackupCodes}
                  className="flex-1 px-6 py-3 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Download Codes
                </button>
                <button
                  onClick={() => setShowBackupCodes(false)}
                  className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  I've Saved My Codes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;