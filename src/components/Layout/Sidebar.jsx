import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiUsers,
  FiTruck,
  FiBarChart2,
  FiSettings,
  FiPackage,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
  FiTrendingUp,
  FiPieChart,
  FiFolder,
  FiTag,
  FiDownload,
  FiUserCheck,
  FiShield,
  FiDollarSign,  // Add this for payments
  FiCreditCard,
  FiCheckCircle   // Add this for payment methods
} from 'react-icons/fi';

const Sidebar = () => {
  const [reportsOpen, setReportsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false); // 
  
  // Get current user from Redux
  const { user } = useSelector((state) => state.auth);
  const [userRole, setUserRole] = useState('staff');

  useEffect(() => {
    if (user) {
      setUserRole(user.role || 'staff');
    }
  }, [user]);

  // Define menu items with role requirements
  const menuItems = [
    { 
      path: '/', 
      icon: FiHome, 
      label: 'Dashboard',
      roles: ['admin', 'manager']
    },
    { 
      path: '/pos', 
      icon: FiShoppingCart, 
      label: 'POS',
      roles: ['admin', 'manager', 'staff']
    },
    
    // Products dropdown
    {
      icon: FiPackage,
      label: 'Products',
      roles: ['admin', 'manager'],
      hasDropdown: true,
      open: productsOpen,
      toggle: () => setProductsOpen(!productsOpen),
      children: [
        { path: '/products', icon: FiPackage, label: 'All Products', roles: ['admin', 'manager'] },
        { path: '/products/new', icon: FiPackage, label: 'Add Product', roles: ['admin', 'manager'] },
      ]
    },
    
    // Categories
    { 
      path: '/categories', 
      icon: FiFolder, 
      label: 'Categories',
      roles: ['admin', 'manager']
    },
    
    // Sales
    { 
      path: '/sales', 
      icon: FiShoppingBag, 
      label: 'Sales',
      roles: ['admin', 'manager', 'staff']
    },
    
    // Customers
    { 
      path: '/customers', 
      icon: FiUsers, 
      label: 'Customers',
      roles: ['admin', 'manager']
    },
    
    // Payments dropdown - NEW!
    {
      icon: FiDollarSign,
      label: 'Payments',
      roles: ['admin', 'manager'], // Only admin and manager can manage payments
      hasDropdown: true,
      open: paymentsOpen,
      toggle: () => setPaymentsOpen(!paymentsOpen),
      children: [
        { path: '/payments', icon: FiCreditCard, label: 'All Payments', roles: ['admin', 'manager'] },
        { path: '/payments/outstanding', icon: FiDollarSign, label: 'Outstanding', roles: ['admin', 'manager'] },
        { path: '/payments/methods', icon: FiCreditCard, label: 'Payment Methods', roles: ['admin', 'manager'] },
      ]
    },
    
    // Vendors
    { 
      path: '/vendors', 
      icon: FiTruck, 
      label: 'Vendors',
      roles: ['admin', 'manager']
    },
    
    // Inventory dropdown
    {
      icon: FiTag,
      label: 'Inventory',
      roles: ['admin', 'manager'],
      hasDropdown: true,
      open: inventoryOpen,
      toggle: () => setInventoryOpen(!inventoryOpen),
      children: [
        { path: '/inventory/stock', icon: FiPackage, label: 'Stock Levels', roles: ['admin', 'manager'] },
        { path: '/inventory/low-stock', icon: FiPackage, label: 'Low Stock', roles: ['admin', 'manager'] },
        { path: '/inventory/adjustments', icon: FiPackage, label: 'Adjustments', roles: ['admin', 'manager'] },
        { path: '/direct-receive', icon: FiDownload, label: 'Direct Receive', roles: ['admin', 'manager'] },
        { path: '/direct-receive/history', icon: FiDownload, label: 'Receive History', roles: ['admin', 'manager'] },
      ]
    },
    
    // Reports dropdown
    {
      icon: FiBarChart2,
      label: 'Reports',
      roles: ['admin', 'manager'],
      hasDropdown: true,
      open: reportsOpen,
      toggle: () => setReportsOpen(!reportsOpen),
      children: [
        { path: '/reports/daily', icon: FiCalendar, label: 'Daily Sales', roles: ['admin', 'manager'] },
        { path: '/reports/top-products', icon: FiTrendingUp, label: 'Top Products', roles: ['admin', 'manager'] },
        { path: '/reports/profit-loss', icon: FiPieChart, label: 'Profit & Loss', roles: ['admin', 'manager'] },
        { path: '/reports/sales-range', icon: FiCalendar, label: 'Sales Range', roles: ['admin', 'manager'] },
        { path: '/reports/customers', icon: FiUsers, label: 'Customer Summary', roles: ['admin', 'manager'] },
        { path: '/reports/inventory', icon: FiPackage, label: 'Inventory Summary', roles: ['admin', 'manager'] },
        { path: '/reports/payments', icon: FiDollarSign, label: 'Payment Summary', roles: ['admin', 'manager'] }, // Add payment report
        { path: '/reports/cashier-sales', icon: FiDollarSign, label: 'Cashier Sales', roles: ['admin', 'manager'] }, // Add cashier sales report
       { path: '/reports/end-of-day', icon: FiCheckCircle, label: 'End of Day', roles: ['admin', 'manager'] },
       {path: '/reports/bank-transactions', icon: FiCreditCard, label: 'Bank Transactions', roles: ['admin', 'manager'] },
       
      ]
    },
    
    //Banks - Admin only
    {
      path: '/banks',
      icon: FiCreditCard,
      label: 'Bank Accounts',
      roles: ['admin']
    },

    // Users - Admin only
    { 
      path: '/users', 
      icon: FiUserCheck, 
      label: 'User Management',
      roles: ['admin']
    },
    
    // Settings - Admin only
    { 
      path: '/settings', 
      icon: FiSettings, 
      label: 'Settings',
      roles: ['admin']
    },
  ];

  // Filter menu items based on user role
  const getVisibleMenuItems = () => {
    return menuItems.filter(item => 
      item.roles.includes(userRole) || 
      (item.hasDropdown && item.children?.some(child => child.roles.includes(userRole)))
    );
  };

  const visibleMenuItems = getVisibleMenuItems();

  // Role badge component
  const RoleBadge = () => {
    const roleColors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      staff: 'bg-green-100 text-green-800'
    };

    return (
      <div className={`px-3 py-1 mb-4 rounded-full text-xs font-medium inline-block ${roleColors[userRole]}`}>
        <span className="flex items-center gap-1">
          <FiShield size={12} />
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
        </span>
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-lg overflow-y-auto pb-8">
      <nav className="p-4">
        {/* Role Badge */}
        <RoleBadge />

        <ul className="space-y-2">
          {visibleMenuItems.map((item) => {
            if (item.hasDropdown) {
              // Check if any child is visible for this role
              const visibleChildren = item.children.filter(child => 
                child.roles.includes(userRole)
              );

              if (visibleChildren.length === 0) return null;

              return (
                <li key={item.label}>
                  <button
                    onClick={item.toggle}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </span>
                    {item.open ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  
                  {item.open && (
                    <ul className="mt-2 ml-6 space-y-1">
                      {visibleChildren.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              `flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                              }`
                            }
                          >
                            <child.icon className="w-4 h-4" />
                            <span className="text-sm">{child.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            // Regular menu item (no dropdown)
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
        
        {/* Extra bottom padding */}
        <div className="h-8"></div>
      </nav>
    </aside>
  );
};

export default Sidebar;