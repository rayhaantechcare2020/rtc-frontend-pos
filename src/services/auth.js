// services/auth.js
import api from './api';

export const authService = {
  // Get the current API base URL (for debugging)
  getApiUrl() {
    return api.defaults.baseURL;
  },

  // Test connection to backend
  async testConnection() {
    try {
      console.log('Testing connection to:', api.defaults.baseURL);
      const response = await api.get('/test-connection', { timeout: 5000 });
      console.log('Connection test response:', response.data);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error.message);
      return false;
    }
  },

  async register(companyData) {
    try {
      console.log('Attempting registration...');
      const response = await api.post('/register', companyData);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('company', JSON.stringify(response.data.data.company));
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleError(error);
    }
  },

  async login(credentials) {
    try {
      console.log('Attempting login with:', credentials.email);
      console.log('API URL:', api.defaults.baseURL);
      
      const response = await api.post('/login', credentials);
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('company', JSON.stringify(response.data.data.company));
        
        // Set default auth header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
      }
      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      throw this.handleError(error);
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    delete api.defaults.headers.common['Authorization'];
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getCurrentCompany() {
    const company = localStorage.getItem('company');
    return company ? JSON.parse(company) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Handle different types of errors
  handleError(error) {
    console.error('Error object:', error);
    
    // Network errors (connection refused, no internet)
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      return {
        success: false,
        message: 'Cannot connect to server. Please make sure the backend server is running.',
        connectionError: true,
        code: 'CONNECTION_REFUSED'
      };
    }
    
    // Request timeout
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'Request timeout. Server is taking too long to respond.',
        connectionError: true,
        code: 'TIMEOUT'
      };
    }
    
    // Server responded with an error
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return {
          success: false,
          message: data.message || data.error || 'Invalid email or password',
          status: 401,
          code: 'UNAUTHORIZED'
        };
      }
      
      if (status === 403) {
        return {
          success: false,
          message: data.message || data.error || 'Account locked or inactive',
          status: 403,
          code: 'FORBIDDEN'
        };
      }
      
      if (status === 422) {
        return {
          success: false,
          message: data.message || 'Validation error',
          errors: data.errors,
          status: 422,
          code: 'VALIDATION_ERROR'
        };
      }
      
      if (status === 500) {
        return {
          success: false,
          message: 'Server error. Please try again later.',
          status: 500,
          code: 'SERVER_ERROR'
        };
      }
      
      return {
        success: false,
        message: data.message || data.error || 'An error occurred',
        status: status,
        code: 'UNKNOWN_ERROR'
      };
    }
    
    // Request was made but no response received
    if (error.request) {
      return {
        success: false,
        message: 'No response from server. Please check your connection.',
        connectionError: true,
        code: 'NO_RESPONSE'
      };
    }
    
    // Something else happened
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN'
    };
  }
};

export default authService;