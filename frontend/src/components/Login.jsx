import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    two_fa_token: '',
  });
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(formData);
      
      if (response.requires_2fa_setup) {
        toast.success('Please set up two-factor authentication to continue');
        navigate('/setup-2fa', {
          state: {
            username: formData.username,
            password: formData.password,
            user_id: response.user_id
          }
        });
        return;
      }
      
      if (response.requires_2fa) {
        setRequires2FA(true);
        setPendingLogin({ username: formData.username, password: formData.password });
        toast.success('Enter your two-factor authentication code');
        return;
      }
      
      if (response.requires_email_verification) {
        toast.error('Please verify your email before logging in - Check your inbox');
        return;
      }
      
      toast.success('Login successful');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.detail || 
                       'Login failed - Please check your credentials';
      toast.error(errorMsg);
      
      if (requires2FA) {
        setFormData(prev => ({ ...prev, two_fa_token: '' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setPendingLogin(null);
    setFormData({
      username: '',
      password: '',
      two_fa_token: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/')}
              className="text-xl font-semibold text-gray-900"
            >
              Tunzadent
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-28">
        <h2 className="text-2xl font-semibold text-gray-900 uppercase tracking-wide text-center py-5">
              {requires2FA ? 'Two-Factor Authentication' : 'Login'}
        </h2>
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!requires2FA ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 px-6 py-4">
                    <p className="text-sm text-blue-900 font-medium mb-1">
                      Authentication Required
                    </p>
                    <p className="text-xs text-blue-700">
                      Logged in as: <span className="font-semibold">{pendingLogin?.username}</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Authentication Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      autoFocus
                      className="w-full px-4 py-3 border border-gray-300 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="000000"
                      value={formData.two_fa_token}
                      onChange={(e) => setFormData({ ...formData, two_fa_token: e.target.value.replace(/\D/g, '') })}
                      disabled={loading}
                    />
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Enter the 6-digit code from your authenticator application
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 text-center"
                  >
                    Back to login
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || (requires2FA && formData.two_fa_token.length !== 6)}
                  className="w-full px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    requires2FA ? 'Verify Authentication Code' : 'Login'
                  )}
                </button>
              </div>

              {!requires2FA && (
                <div className="text-center pt-4 border-t border-gray-200">
                  <Link 
                    to="/register" 
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Do not have an account? <span className="font-medium text-blue-600 hover:text-blue-800">Create account</span>
                  </Link>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to home page
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;