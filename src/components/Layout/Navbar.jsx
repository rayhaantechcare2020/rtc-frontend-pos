import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser, FiCreditCard, FiBell, FiSun, FiMoon} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { authService } from '../../services/auth';

const Navbar = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const company = useSelector((state) => state.auth.company); // Get company from Redux
  const [logoError, setLogoError] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Get logo URL from company data
  const getLogoUrl = () => {
    if (!company?.logo) return null;
    
    // If logo is a full URL (starts with http)
    if (company.logo.startsWith('http')) {
      return company.logo;
    }
    
    // If logo is stored in storage path
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // Remove /api from baseUrl if present
    const storageBaseUrl = baseUrl.replace('/api', '');
    return `${storageBaseUrl}/storage/${company.logo}`;
  };

  const logoUrl = getLogoUrl();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg fixed w-full z-10">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              {/* Logo with fallback */}
              {!logoError && logoUrl ? (
                <img 
                  src={logoUrl}
                  alt={company?.name || "Logo"} 
                  className="h-8 w-auto"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-8 w-8 bg-linear-to-r from-blue-600 to-purple-600 rounded-lg">
                  <span className="text-white text-sm font-bold">
                    {company?.name ? company.name.charAt(0).toUpperCase() : 'R'}
                  </span>
                </div>
              )}
              
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                {company?.name || 'RTCLTD Store'}
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <button className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-300">
              <FiBell className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-300"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;