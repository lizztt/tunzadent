import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import toast from 'react-hot-toast';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  CheckIcon, 
  XMarkIcon, 
  EnvelopeIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'dentist',
  });
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);  
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prevShowPassword => !prevShowPassword);
  };

  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(req => req);

  const validateForm = () => {
    const newErrors = {};

    if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!allRequirementsMet) {
      newErrors.password = 'Password does not meet all security requirements';
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setErrors({});

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(formData);
      console.log('Registration response:', response.data);
      toast.success('Registration successful - Please check your email');
      setRegistered(true);
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.username) {
          setErrors(prev => ({ ...prev, username: errorData.username[0] }));
          toast.error(errorData.username[0]);
        }
        if (errorData.email) {
          setErrors(prev => ({ ...prev, email: errorData.email[0] }));
          toast.error(errorData.email[0]);
        }
        if (errorData.password) {
          setErrors(prev => ({ ...prev, password: errorData.password[0] }));
          toast.error(errorData.password[0]);
        }
        if (errorData.password_confirm) {
          setErrors(prev => ({ ...prev, password_confirm: errorData.password_confirm[0] }));
          toast.error(errorData.password_confirm[0]);
        }
        
        if (errorData.error || errorData.detail) {
          toast.error(errorData.error || errorData.detail);
        }
        
        if (!errorData.username && !errorData.email && !errorData.password && !errorData.error && !errorData.detail) {
          toast.error('Registration failed - Please try again');
        }
      } else {
        toast.error('Unable to connect to server - Please check your connection');
      }
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50">
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

        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <h2 className="text-sm font-semibold text-green-900 uppercase tracking-wide">
                Account Created Successfully
              </h2>
            </div>
            
            <div className="px-6 py-8 text-center">
              <div className="mb-6">
                <EnvelopeIcon className="w-16 h-16 mx-auto text-green-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Verify Your Email Address
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                A verification link has been sent to:
              </p>
              <p className="text-sm font-semibold text-gray-900 mb-6">
                {formData.email}
              </p>

              <div className="bg-blue-50 border border-blue-200 px-6 py-4 mb-6 text-left">
                <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">
                  Next Steps
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-blue-600 rounded-full"></span>
                    <span>Check your email inbox for the verification link</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-blue-600 rounded-full"></span>
                    <span>Click the verification link to activate your account</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 mt-2 mr-3 flex-shrink-0 bg-blue-600 rounded-full"></span>
                    <span>Return to login and complete two-factor authentication setup</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Proceed to Login
              </button>

              <p className="mt-4 text-xs text-gray-500">
                Did not receive the email? Check your spam folder or contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center">
            Sign Up
          </h2>
          <p className="mt-1 text-sm text-gray-500 text-center">
            Register for access to Tunzadent
          </p>
        </div>

        <div className="bg-white border border-gray-200">
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      className={`w-full px-4 py-3 border ${
                        errors.first_name ? 'border-red-500' : 'border-gray-300'
                      } text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter first name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      disabled={loading}
                    />
                    {errors.first_name && (
                      <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      className={`w-full px-4 py-3 border ${
                        errors.last_name ? 'border-red-500' : 'border-gray-300'
                      } text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter last name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      disabled={loading}
                    />
                    {errors.last_name && (
                      <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Credentials */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Account Credentials
                </h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      className={`w-full px-4 py-3 border ${
                        errors.username ? 'border-red-500' : 'border-gray-300'
                      } text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={loading}
                    />
                    {errors.username && (
                      <p className="text-xs text-red-600 mt-1">{errors.username}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Minimum 3 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      className={`w-full px-4 py-3 border ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field with Show/Hide Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className={`w-full px-4 py-3 border ${
                          errors.password ? 'border-red-500' : allRequirementsMet ? 'border-green-500' : 'border-gray-300'
                        } text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-12`}
                        placeholder="Create a secure password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        onFocus={() => setShowPasswordRequirements(true)}
                        disabled={loading}
                      />
                      
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-600 hover:text-gray-900 focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" /> 
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {errors.password && (
                      <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                    )}
                    
                    {/* Password Requirements Checklist */}
                    {(showPasswordRequirements || formData.password) && (
                      <div className="mt-3 bg-gray-50 border border-gray-200 p-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                        <div className="space-y-1">
                          <div className="flex items-center text-xs">
                            {passwordRequirements.minLength ? (
                              <CheckIcon className="w-4 h-4 text-green-600 mr-2" />
                            ) : (
                              <XMarkIcon className="w-4 h-4 text-red-600 mr-2" />
                            )}
                            <span className={passwordRequirements.minLength ? 'text-green-700' : 'text-gray-600'}>
                              At least 8 characters
                            </span>
                          </div>

                          <div className="flex items-center text-xs">
                            {passwordRequirements.hasUppercase ? (
                              <CheckIcon className="w-4 h-4 text-green-600 mr-2" />
                            ) : (
                              <XMarkIcon className="w-4 h-4 text-red-600 mr-2" />
                            )}
                            <span className={passwordRequirements.hasUppercase ? 'text-green-700' : 'text-gray-600'}>
                              At least one uppercase letter (A-Z)
                            </span>
                          </div>

                          <div className="flex items-center text-xs">
                            {passwordRequirements.hasLowercase ? (
                              <CheckIcon className="w-4 h-4 text-green-600 mr-2" />
                            ) : (
                              <XMarkIcon className="w-4 h-4 text-red-600 mr-2" />
                            )}
                            <span className={passwordRequirements.hasLowercase ? 'text-green-700' : 'text-gray-600'}>
                              At least one lowercase letter (a-z)
                            </span>
                          </div>

                          <div className="flex items-center text-xs">
                            {passwordRequirements.hasNumber ? (
                              <CheckIcon className="w-4 h-4 text-green-600 mr-2" />
                            ) : (
                              <XMarkIcon className="w-4 h-4 text-red-600 mr-2" />
                            )}
                            <span className={passwordRequirements.hasNumber ? 'text-green-700' : 'text-gray-600'}>
                              At least one number (0-9)
                            </span>
                          </div>

                          <div className="flex items-center text-xs">
                            {passwordRequirements.hasSpecial ? (
                              <CheckIcon className="w-4 h-4 text-green-600 mr-2" />
                            ) : (
                              <XMarkIcon className="w-4 h-4 text-red-600 mr-2" />
                            )}
                            <span className={passwordRequirements.hasSpecial ? 'text-green-700' : 'text-gray-600'}>
                              At least one special character (!@#$%^&*)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className={`w-full px-4 py-3 border ${
                          errors.password_confirm ? 'border-red-500' : 
                          formData.password_confirm && formData.password === formData.password_confirm ? 'border-green-500' : 
                          'border-gray-300'
                        } text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-12`}
                        placeholder="Confirm your password"
                        value={formData.password_confirm}
                        onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                        disabled={loading}
                      />
                      
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-600 hover:text-gray-900 focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" /> 
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {errors.password_confirm && (
                      <p className="text-xs text-red-600 mt-1">{errors.password_confirm}</p>
                    )}
                    {formData.password_confirm && formData.password === formData.password_confirm && (
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <CheckIcon className="w-3 h-3 mr-1" />
                        Passwords match
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 px-6 py-3 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Dentist Account'
                )}
              </button>
            </div>

            <div className="text-center pt-6 border-t border-gray-200 mt-6">
              <Link 
                to="/login" 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Already have an account? <span className="font-medium text-blue-600 hover:text-blue-800">Sign in</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;