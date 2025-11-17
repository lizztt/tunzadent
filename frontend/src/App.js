import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import UploadXRay from './components/UploadXRay';
import Patients from './components/Patients';
import Results from './components/Results';
import Settings from './components/Settings';
import VerifyEmail from './components/VerifyEmail';
import Setup2FA from './components/Setup2FA';
import LandingPage from './components/LandingPage';
import ScanHistory from './components/ScanHistory';
import BulkUpload from './components/BulkUpload';


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 5000, // 5 seconds instead of default 2 seconds
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 5000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 6000, // Errors stay longer
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <UploadXRay />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patients" 
            element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patients/:patientId/history" 
            element={
              <ProtectedRoute>
                <ScanHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/results/:scanId?" 
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/verify-email/:token" 
            element={<VerifyEmail />}
          />
          <Route 
            path="/setup-2fa" 
            element={<Setup2FA />}
          />

          <Route path="/bulk-upload"
            element={<BulkUpload />}
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;