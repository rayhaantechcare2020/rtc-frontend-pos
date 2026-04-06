import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FiSave, 
  FiUser, 
  FiHome, 
  FiBell, 
  FiLock, 
  FiPrinter,
  FiDollarSign,
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { companyService } from '../../services/company';
import { setCredentials } from '../../store/authSlice';
import PrinterSettings from './PrinterSettings';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  // Dark mode state - read from localStorage or system preference
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    tax_number: '',
    registration_number: '',
    currency: '₦',
    currency_code: 'NGN',
    timezone: 'Africa/Lagos',
    date_format: 'd/m/Y',
    logo: null
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const response = await companyService.getCompany();
      if (response.success) {
        setCompany(response.data);
        if (response.data.logo) {
          setLogoPreview(response.data.logo);
        }
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await companyService.updateCompany(company);
      if (response.success) {
        toast.success('Company information updated');
        
        dispatch(setCredentials({
          user: user,
          company: response.data
        }));
      }

      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const logoResponse = await companyService.uploadLogo(formData);
        if (logoResponse.success) {
          toast.success('Logo uploaded successfully');
          
          dispatch(setCredentials({
            user: user,
            company: {
              ...company,
              logo: logoResponse.data.logo_url
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'company', name: 'Company Info', icon: FiHome },
    { id: 'profile', name: 'My Profile', icon: FiUser },
    { id: 'printer', name: 'Printer Settings', icon: FiPrinter },
    { id: 'currency', name: 'Currency & Tax', icon: FiDollarSign },
    { id: 'appearance', name: 'Appearance', icon: darkMode ? FiSun : FiMoon },
    { id: 'security', name: 'Security', icon: FiLock },
    { id: 'notifications', name: 'Notifications', icon: FiBell },
  ];

  if (loading && !company.name) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b px-6 overflow-x-auto">
          <nav className="flex space-x-8 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 flex items-center gap-2 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Company Info Tab */}
          {activeTab === 'company' && (
            <form onSubmit={handleCompanySubmit} className="space-y-6">
              {/* ... your existing company form content ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiHome className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={company.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={company.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="company@example.com"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={company.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="08012345678"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <div className="relative">
                    <FiGlobe className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="url"
                      name="website"
                      value={company.website}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                {/* Tax Number */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tax/VAT Number</label>
                  <input
                    type="text"
                    name="tax_number"
                    value={company.tax_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="TAX-12345"
                  />
                </div>

                {/* Registration Number */}
                <div>
                  <label className="block text-sm font-medium mb-2">Registration Number</label>
                  <input
                    type="text"
                    name="registration_number"
                    value={company.registration_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="RC-123456"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      name="address"
                      value={company.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Company address"
                    />
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Company Logo</label>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Company logo" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FiHome size={32} />
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="logo"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="logo"
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer"
                      >
                        Choose Logo
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Recommended: 200x200px, PNG or JPG, max 2MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                  <FiSave /> Update Profile
                </button>
              </form>
            </div>
          )}

          {/* Printer Settings Tab */}
          {activeTab === 'printer' && (
            <PrinterSettings />
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Appearance Settings</h2>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium mb-1">Dark Mode</h3>
                    <p className="text-sm text-gray-500">Switch between light and dark theme</p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium mb-1">Current Theme</h3>
                      <p className="text-sm text-gray-500">
                        {darkMode ? '🌙 Dark Mode is active' : '☀️ Light Mode is active'}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className={`p-3 rounded-lg ${!darkMode ? 'ring-2 ring-blue-500' : 'opacity-50'}`}>
                        <div className="w-20 h-12 bg-white border rounded shadow-sm"></div>
                        <span className="text-xs mt-1 block text-center">Light</span>
                      </div>
                      <div className={`p-3 rounded-lg ${darkMode ? 'ring-2 ring-blue-500' : 'opacity-50'}`}>
                        <div className="w-20 h-12 bg-gray-800 border rounded shadow-sm"></div>
                        <span className="text-xs mt-1 block text-center">Dark</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Currency & Tax Tab */}
          {activeTab === 'currency' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Currency & Tax Settings</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency Symbol</label>
                    <input
                      type="text"
                      name="currency"
                      value={company.currency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="₦"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency Code</label>
                    <input
                      type="text"
                      name="currency_code"
                      value={company.currency_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="NGN"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Timezone</label>
                    <select
                      name="timezone"
                      value={company.timezone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="Africa/Lagos">Lagos (UTC+1)</option>
                      <option value="Africa/Accra">Accra (UTC+0)</option>
                      <option value="Africa/Nairobi">Nairobi (UTC+3)</option>
                      <option value="Africa/Johannesburg">Johannesburg (UTC+2)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date Format</label>
                    <select
                      name="date_format"
                      value={company.date_format}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="d/m/Y">DD/MM/YYYY</option>
                      <option value="m/d/Y">MM/DD/YYYY</option>
                      <option value="Y-m-d">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                  <FiSave /> Save Settings
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;