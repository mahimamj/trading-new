import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: { name: string; email: string; phone: string; password: string; referralCode?: string }) =>
    api.post('/auth/register', userData),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  
  getProfile: () => api.get('/dashboard/profile'),
  
  updateProfile: (data: { name: string; phone: string }) =>
    api.put('/dashboard/profile', data),
  
  getStats: () => api.get('/dashboard/stats'),
};

// Account API
export const accountAPI = {
  deposit: (data: { amount: number; description?: string }) =>
    api.post('/account/deposit', data),
  
  withdraw: (data: { amount: number; description?: string }) =>
    api.post('/account/withdraw', data),
  
  getHistory: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
    api.get('/account/history', { params }),
  
  getTransaction: (id: string) => api.get(`/account/transaction/${id}`),
  
  cancelTransaction: (id: string) => api.put(`/account/transaction/${id}/cancel`),
};

// Referral API
export const referralAPI = {
  getOverview: () => api.get('/referral/overview'),
  
  getEarnings: (params?: { page?: number; limit?: number }) =>
    api.get('/referral/earnings', { params }),
  
  getStats: () => api.get('/referral/stats'),
  
  generateCode: () => api.post('/referral/generate-code'),
};

export default api;
