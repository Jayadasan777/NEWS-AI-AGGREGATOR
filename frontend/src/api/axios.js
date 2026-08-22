import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const trimmed = envUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  // In development fallback to localhost, in production fallback to relative /api
  return import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
});

// Automatically attach admin secret key if available in localStorage or in local dev
API.interceptors.request.use((config) => {
  const adminKey = localStorage.getItem('nise_admin_token') || (import.meta.env.DEV ? 'NISE-ADMIN-2026-DASAN-X9K7M2P' : '');
  if (adminKey) {
    config.headers['x-admin-key'] = adminKey;
  }
  return config;
});

export default API;