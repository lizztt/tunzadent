import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const publicEndpoints = [
      '/accounts/register/', 
      '/accounts/login/', 
      '/accounts/verify-email/', 
      '/accounts/2fa/setup/', 
      '/accounts/2fa/complete/',
      '/accounts/resend-verification/'
    ];
    const isPublicEndpoint = publicEndpoints.some(endpoint => originalRequest.url.includes(endpoint));

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/accounts/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('accessToken', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/accounts/login/', credentials),
  register: (data) => api.post('/accounts/register/', data),
  getProfile: () => api.get('/accounts/profile/'),
  updateProfile: (data) => api.patch('/accounts/profile/update/', data),
  changePassword: (data) => api.post('/accounts/change-password/', data),
  verifyEmail: (token) => api.post('/accounts/verify-email/', { token }),
  setup2FA: (data) => api.post('/accounts/2fa/setup/', data),
  complete2FA: (data) => api.post('/accounts/2fa/complete/', data),
  regenerateBackupCodes: () => api.post('/accounts/2fa/regenerate-backup-codes/'),
  resendVerification: (email) => api.post('/accounts/resend-verification/', { email }),
};

// Patient services
export const patientService = {
  getAll: () => api.get('/predictions/patients/'),
  getOne: (id) => api.get(`/predictions/patients/${id}/`),
  create: (data) => api.post('/predictions/patients/', data),
  update: (id, data) => api.put(`/predictions/patients/${id}/`, data),
  delete: (id) => api.delete(`/predictions/patients/${id}/`), 
};

// Prediction services
export const predictionService = {
  uploadAndPredict: (formData) => 
    api.post('/predictions/upload-predict/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getStats: () => api.get('/predictions/stats/'),
  getPatientScans: (patientId) => api.get(`/predictions/patients/${patientId}/scans/`), 
  getScanDetails: (scanId) => api.get(`/predictions/scans/${scanId}/`)
};

export default api;