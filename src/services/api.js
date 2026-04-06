// services/api.js
import axios from 'axios';

// Get API URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

console.log('🔧 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      console.error('❌ Cannot connect to server');
      alert(`Cannot connect to ${API_URL}\n\nMake sure Laravel is running:\nphp artisan serve --host=0.0.0.0 --port=8000`);
    }
    return Promise.reject(error);
  }
);

export default api;