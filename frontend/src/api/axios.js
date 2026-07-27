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

export default API;