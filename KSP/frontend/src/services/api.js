import axios from 'axios';

export const API_BASE_URL = (process.env.REACT_APP_API_URL || '/api').replace(/\/+$/, '');

export const resolveMediaUrl = (url) => {
  if (!url) return null;

  const mediaUrl = String(url).trim();
  if (/^https?:\/\//i.test(mediaUrl)) return mediaUrl;

  const apiOrigin = API_BASE_URL.replace(/\/api$/, '');
  return `${apiOrigin}${mediaUrl.startsWith('/') ? '' : '/'}${mediaUrl}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to request headers if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If status is 401, and it's NOT a login attempt, redirect to login
    // We don't want to redirect if we're already trying to login!
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
