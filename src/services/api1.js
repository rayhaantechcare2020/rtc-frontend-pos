// services/api.js
import axios from 'axios';


// Get the correct API URL
const getApiUrl = () => {
  // Check if we're in production or development
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    // Make sure the URL ends with /api
    const baseUrl = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
    console.log('Using API URL from env:', baseUrl);
    return baseUrl;
  }
  
  // Default for local development
  console.log('Using default API URL: http://localhost:8000/api');
  return 'http://localhost:8000/api';
};

const API_URL = getApiUrl();

console.log('🔧 API Configuration:');
console.log('  Base URL:', API_URL);
console.log('  Environment:', import.meta.env.MODE);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: false, // Set to false for token-based auth
  timeout: 30000 // 30 seconds timeout for slower connections
});

// Request interceptor to add token and log requests
api.interceptors.request.use(
  (config) => {
    // Log the full request URL for debugging
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`📤 ${config.method.toUpperCase()} ${fullUrl}`);
    
    // Add token if exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Network error: Cannot connect to server');
      alert('Cannot connect to server. Please check:\n' +
            '1. Backend server is running\n' +
            '2. Server URL is correct: ' + API_URL + '\n' +
            '3. No firewall blocking the connection');
      return Promise.reject(error);
    }
    
    if (error.code === 'ERR_CONNECTION_REFUSED') {
      console.error('❌ Connection refused: Server not running or wrong port');
      alert(`Connection refused. Please make sure the backend server is running at:\n${API_URL}`);
      return Promise.reject(error);
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timeout: Server took too long to respond');
      alert('Request timeout. Server is taking too long to respond.');
      return Promise.reject(error);
    }
    
    if (error.response) {
      // Server responded with an error status
      console.error(`❌ ${error.config?.url} - ${error.response.status}:`, error.response.data);
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        console.log('Token expired or invalid, logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('company');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.error('Access denied');
        alert('You do not have permission to perform this action.');
      }
      
      // Handle 422 Validation Error
      if (error.response.status === 422) {
        console.error('Validation error:', error.response.data.errors);
      }
      
      // Handle 500 Server Error
      if (error.response.status === 500) {
        console.error('Server error:', error.response.data);
        alert('Server error occurred. Please try again later.');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('❌ No response received from server');
      alert('No response from server. Please check your connection.');
    } else {
      // Something else happened
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// // Helper function to test connection
// export const testConnection = async () => {
//   try {
//     console.log('Testing connection to:', API_URL);
//     const response = await api.get('/test-connection', { timeout: 5000 });
//     console.log('✅ Connection test successful:', response.data);
//     return { success: true, data: response.data };
//   } catch (error) {
//     console.error('❌ Connection test failed:', error.message);
//     return { success: false, error: error.message };
//   }
// };

// Helper to get current API URL
//export const getApiUrl = () => API_URL;

export default api;