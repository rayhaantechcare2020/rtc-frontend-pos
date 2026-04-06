import { Provider, useSelector } from 'react-redux';
import React, {Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import TestTailwind from './TestTailwind';





// Layout
import Layout from './components/Layout/Layout';

// Auth
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import UserList from './components/Users/UserList';

// Dashboard
import Dashboard from './components/Dashboard/Dashboard';



// POS
const POS = lazy(() => import('./components/POS/POS'));
import CashierSales from './components/Reports/CashierSales';
import EndOfDay from './components/Reports/EndOfDay';

//BANK
import BankManager from './components/BankManager';

//Categories
import CategoryList from './components/Categories/CategoryList';

// Products
import ProductList from './components/Products/ProductList';
import ProductForm from './components/Products/ProductForm';

// Sales
import SalesHistory from './components/Sales/SalesHistory';
import SalesDetail from './components/Sales/SalesDetail';

//Inventory
import StockLevels from './components/Inventory/StockLevels';
import LowStock from './components/Inventory/LowStock';
import StockAdjustments from './components/Inventory/StockAdjustments';
import ImportProducts from './components/Inventory/ImportProducts';

// Customers
import CustomerList from './components/Customers/CustomerList';
import CustomerForm from './components/Customers/CustomerForm';
import CustomerPayments from './components/Customers/CustomerPayments';

//Payments
import AllPayments from './components/Payments/AllPayments';
import OutstandingPayments from './components/Payments/OutstandingPayments';
import PaymentMethods from './components/Payments/PaymentMethods';
import PaymentSummary from './components/Reports/PaymentSummary';

// Reports
import Reports from './components/Reports/Reports';
import DailySales from './components/Reports/DailySales';
import TopProducts from './components/Reports/TopProducts';
import ProfitLoss from './components/Reports/ProfitLoss';
import SalesRange from './components/Reports/SalesRange';
import CustomerSummary from './components/Reports/CustomerSummary';
import InventorySummary from './components/Reports/InventorySummary';
import BankTransactionReport from './components/Reports/BankTransactionReport';


//Vendors
import VendorList from './components/Vendors/VendorList';
import VendorForm from './components/Vendors/VendorForm';

//Settings
import Settings from './components/Settings/Settings';

//import direct receive
import DirectReceive from './components/Inventory/DirectReceive';
import DirectReceiveHistory from './components/Inventory/DirectReceiveHistory';
import DirectReceiveDetail from './components/Inventory/DirectReceiveDetail';
import { useEffect, useState } from 'react';
import SimpleConnectionTest from './components/SimpleConnectionTest';


// Simple page loader component
const PageLoader = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Create a role-based protected route component
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};


// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();
   const token = localStorage.getItem('token');

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


  
  


function App(){
   // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
  import('./components/POS/POS');
  import('./components/Dashboard/Dashboard');
}, []);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
           <Route path="/simpleconnection" element = {<SimpleConnectionTest />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout darkMode={darkMode} setDarkMode={setDarkMode}/>
            </ProtectedRoute>
          }>
            <Route index element={<RoleBasedRoute allowedRoles={['admin', 'manager']}>
              <Dashboard />
              </RoleBasedRoute>} 
            />
            <Route path="pos" element={<RoleBasedRoute allowedRoles={['admin', 'manager', 'staff']}>
              <POS />
              </RoleBasedRoute>} 
            />
            <Route path="users" element={<RoleBasedRoute allowedRoles={['admin']}> <UserList /> </RoleBasedRoute>} />
            <Route path="/products"  element={<RoleBasedRoute allowedRoles={['admin','manager']}> <ProductList /> </RoleBasedRoute>} />
            <Route path="products/new" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <ProductForm /> </RoleBasedRoute>} />
            <Route path="products/:id" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <ProductForm /> </RoleBasedRoute>} />
            <Route path="sales" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <SalesHistory /> </RoleBasedRoute>} />
            <Route path="sales/:id" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <SalesDetail /> </RoleBasedRoute>} />
            <Route path="customers/" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <CustomerList /> </RoleBasedRoute>} />
            <Route path="customers/new" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <CustomerForm /> </RoleBasedRoute>} />
            <Route path="customers/:id" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <CustomerForm /> </RoleBasedRoute>} />
            <Route path="vendors/" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <VendorList /> </RoleBasedRoute>} />
            <Route path="vendors/new" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <VendorForm /> </RoleBasedRoute>} />
            <Route path="vendors/:id"element={<RoleBasedRoute allowedRoles={['admin','manager']}> <VendorForm /> </RoleBasedRoute>} />
            <Route path="reports" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <Reports /> </RoleBasedRoute>} />
            <Route path="reports/top-products" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <TopProducts /> </RoleBasedRoute>} />
            <Route path="reports/profit-loss" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <ProfitLoss /> </RoleBasedRoute>} />
            <Route path="reports/daily" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <DailySales /> </RoleBasedRoute>} />
            <Route path="reports/sales-range" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <SalesRange /> </RoleBasedRoute>} />
            <Route path="reports/customers" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <CustomerSummary /> </RoleBasedRoute>} />
            <Route path="reports/inventory" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <InventorySummary /> </RoleBasedRoute>} />
            <Route path="settings" element={<RoleBasedRoute allowedRoles={['admin']}> <Settings /> </RoleBasedRoute>} />
            <Route path="categories" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <CategoryList /> </RoleBasedRoute>} />
            <Route path="direct-receive" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <DirectReceive /> </RoleBasedRoute>} />
            <Route path="direct-receive/history" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <DirectReceiveHistory /> </RoleBasedRoute>} />
            <Route path="direct-receive/:id" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <DirectReceiveDetail /> </RoleBasedRoute>} />
            <Route path="customers/:id/payments" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <CustomerPayments /> </RoleBasedRoute>} />
            <Route path="inventory/stock" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <StockLevels /> </RoleBasedRoute>} />
            <Route path="inventory/low-stock" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <LowStock /> </RoleBasedRoute>} />
            <Route path="inventory/adjustments" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <StockAdjustments /> </RoleBasedRoute>} />
            <Route path="reports/cashier-sales" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <CashierSales /> </RoleBasedRoute>} />
            <Route path="reports/end-of-day" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <EndOfDay /> </RoleBasedRoute>} />
            <Route path="import/products" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <ImportProducts /> </RoleBasedRoute>} />
            <Route path="reports/bank-transactions" element={<RoleBasedRoute allowedRoles={['admin','manager']}> <BankTransactionReport /> </RoleBasedRoute>} />
            <Route path="payments" element={
  <RoleBasedRoute allowedRoles={['admin', 'manager']}>
    <AllPayments />
  </RoleBasedRoute>
} />
<Route path="banks" element={
  <RoleBasedRoute allowedRoles={['admin']}>
    <BankManager />
  </RoleBasedRoute>
} />

<Route path="payments/outstanding" element={
  <RoleBasedRoute allowedRoles={['admin', 'manager']}>
    <OutstandingPayments />
  </RoleBasedRoute>
} />
<Route path="payments/methods" element={
  <RoleBasedRoute allowedRoles={['admin', 'manager']}>
    <PaymentMethods />
  </RoleBasedRoute>
} />
<Route path="reports/payments" element={
  <RoleBasedRoute allowedRoles={['admin', 'manager']}>
    <PaymentSummary />
  </RoleBasedRoute>
} />

          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
}

export default App;