import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safely get user from localStorage
    try {
      const storedUser = localStorage.getItem('user');
      
      // Check if storedUser exists and is not "undefined" string
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } else {
        // Clear invalid data
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const data = response.data;
      
      // Handle different response types
      
      // Case 1: Email verification required
      if (data.requires_email_verification) {
        return data;
      }
      
      // Case 2: 2FA setup required
      if (data.requires_2fa_setup) {
        return data;
      }
      
      // Case 3: 2FA token required
      if (data.requires_2fa) {
        return data;
      }
      
      // Case 4: Successful login
      if (data.access && data.refresh && data.user) {
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};