import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth';
import { setCredentials } from '../../store/authSlice';
import { FiMail, FiLock, FiLogIn, FiWifiOff, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get API URL on component mount
  useEffect(() => {
    const getApiUrl = async () => {
      try {
        const url = await authService.getApiUrl();
        setApiUrl(url);
        console.log('API URL:', url);
        
        // Test connection on mount
        const isConnected = await authService.testConnection();
        if (!isConnected) {
          setConnectionError(true);
          toast.error('Cannot connect to server. Please check if backend is running.');
        }
      } catch (error) {
        console.error('Failed to get API URL:', error);
        setConnectionError(true);
      }
    };
    
    getApiUrl();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setConnectionError(false);
    
    try {
      console.log('Attempting login with:', { email });
      
      const response = await authService.login({ email, password });
      console.log('Login response:', response);
      
      if (response.success) {
        dispatch(setCredentials({
          user: response.data.user,
          company: response.data.company,
          token: response.data.token
        }));
        
        toast.success('Login successful!');
        navigate('/');
      } else {
        toast.error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error details:', error);
      
      // Handle different types of errors
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        setConnectionError(true);
        toast.error('Cannot connect to server. Please check: \n1. Backend is running\n2. API URL is correct\n3. No firewall blocking');
      } else if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Login failed';
        toast.error(errorMessage);
        
        if (error.response.status === 401) {
          toast.error('Invalid email or password');
        } else if (error.response.status === 403) {
          toast.error('Account locked or inactive');
        }
      } else if (error.request) {
        // Request made but no response
        setConnectionError(true);
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something else happened
        toast.error(error.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const retryConnection = async () => {
    setConnectionError(false);
    setLoading(true);
    
    try {
      const isConnected = await authService.testConnection();
      if (isConnected) {
        toast.success('Connection restored!');
        setConnectionError(false);
      } else {
        setConnectionError(true);
        toast.error('Still cannot connect. Please check backend server.');
      }
    } catch (error) {
      setConnectionError(true);
      toast.error('Connection failed. Make sure backend is running on port 8000');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Local POS Image */}
      <div className="hidden lg:block lg:w-1/2 bg-linear-to-br from-blue-600 to-purple-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Local POS Image */}
        <div className="relative h-full flex flex-col items-center justify-center p-12 text-white">
          {!imageError ? (
            <img 
              src="/images/login1.jpeg"
              alt="Modern POS System"
              className="rounded-2xl shadow-2xl mb-8 max-w-md mx-auto border-4 border-white/20"
              onError={() => setImageError(true)}
            />
          ) : (
            // Fallback illustration if image fails to load
            <div className="w-64 h-64 mb-8 bg-white/10 rounded-2xl flex items-center justify-center border-4 border-white/20">
              <svg className="w-32 h-32 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4V6zm2-4h12v2H6V2zm16 8H2v12h20V10zm-2 10H4v-8h16v8z"/>
              </svg>
            </div>
          )}
          
          <h2 className="text-3xl font-bold text-center mb-4">
            RTC POS - Retail Management Made Easy
          </h2>
          
          <p className="text-center text-lg text-white/90 max-w-md">
            Manage your sales, inventory, customers, and staff all in one place with our smart and reliable POS system.
          </p>

          {/* Feature List */}
          <div className="grid grid-cols-2 gap-4 mt-8 max-w-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Point of Sale</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Inventory Management</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Customer Management</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Reports</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Multi-company Support</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/images/logo-white.png" 
              alt="RTL Store" 
              className="h-16 mx-auto mb-4"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account</p>
          </div>

          {/* Connection Error Banner */}
          {connectionError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <FiWifiOff />
                <span className="font-medium">Connection Error</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                Cannot connect to backend server at: <strong>{apiUrl || 'Loading...'}</strong>
              </p>
              <button
                onClick={retryConnection}
                disabled={loading}
                className="text-sm bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 px-3 py-1 rounded hover:bg-red-200 transition flex items-center gap-1"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                Retry Connection
              </button>
            </div>
          )}

          {/* API URL Info (for debugging - remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500 text-center">
              API: {apiUrl || 'Loading...'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter your email"
                  required
                  disabled={loading || connectionError}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter your password"
                  required
                  disabled={loading || connectionError}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || connectionError}
              className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : connectionError ? (
                <>
                  <FiWifiOff /> Connection Lost
                </>
              ) : (
                <>
                  <FiLogIn /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">RAYHAAN TECH CARE LTD</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Address: 6, Sarkin Yaki Street, Airport Road, Kano State</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Website: www.rayhaantechcare.com.ng</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Email: support@rayhaantechcare.com.ng</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Phone: +2347066720406</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;