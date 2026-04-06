import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { saleService } from '../../services/sale';
import { productService } from '../../services/products';
import { customerService } from '../../services/customer';
import { companyService } from '../../services/company';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, company } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStock: 0,
    revenue: 0,
    profit: 0
  });
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
  try {
    setLoading(true);
    
    // Fetch today's summary
    const todayRes = await saleService.getTodaySummary();
    //console.log('Today Summary:', todayRes);
    
    // Fetch other data
    const [productsRes, customersRes, salesRes] = await Promise.all([
      productService.getProducts({ per_page: 1 }).catch(() => ({ success: false, data: { total: 0 } })),
      customerService.getCustomers({ per_page: 1 }).catch(() => ({ success: false, data: { total: 0 } })),
      saleService.getSales({ per_page: 5 }).catch(() => ({ success: false, data: { data: [] } }))
    ]);

    // Safely extract data with fallbacks
    const todayData = todayRes?.data || {};
    const productsData = productsRes?.data || {};
    const customersData = customersRes?.data || {};
    const salesData = salesRes?.data || {};

    setStats({
      todaySales: todayData.total_revenue || 0,
      todayTransactions: todayData.total_transactions || todayData.total_sales || 0,
      totalProducts: productsData.total || (productsData.data?.length || 0),
      totalCustomers: customersData.total || (customersData.data?.length || 0),
      lowStock: 0,
      revenue: todayData.total_revenue || 0,
      profit: todayData.total_profit || 0
    });

    // Extract recent sales
    setRecentSales(salesData.data || []);
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    toast.error('Failed to load dashboard data');
  } finally {
    setLoading(false);
  }
};
  

  const formatCurrency = (value) => {
    return `₦${Number(value).toLocaleString()}`;
  };

  const StatCard = ({ title, value, icon: Icon, color, link }) => {
    const cardContent = (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold mt-2">
              {loading ? (
                <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
              ) : (
                typeof value === 'number' ? (title.includes('Revenue') || title.includes('Sales') ? formatCurrency(value) : value) : value
              )}
            </p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );

    return link ? <Link to={link}>{cardContent}</Link> : cardContent;
  };

  if (loading && !stats.totalProducts && !stats.totalCustomers) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-lg shadow p-6 h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {company?.name} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Today's Revenue"
          value={stats.todaySales}
          icon={FiDollarSign}
          color="bg-green-600"
        />
        <StatCard
          title="Today's Transactions"
          value={stats.todayTransactions}
          icon={FiShoppingBag}
          color="bg-blue-600"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={FiPackage}
          color="bg-purple-600"
          link="/products"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={FiUsers}
          color="bg-orange-600"
          link="/customers"
        />
      </div>

      {/* Second Row - More Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-blue-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/pos"
              className="p-4 border rounded-lg text-center hover:bg-gray-50 transition"
            >
              <FiShoppingBag className="mx-auto text-2xl mb-2 text-blue-600" />
              <span className="text-sm font-medium">New Sale</span>
            </Link>
            <Link
              to="/products/new"
              className="p-4 border rounded-lg text-center hover:bg-gray-50 transition"
            >
              <FiPackage className="mx-auto text-2xl mb-2 text-green-600" />
              <span className="text-sm font-medium">Add Product</span>
            </Link>
            <Link
              to="/customers/new"
              className="p-4 border rounded-lg text-center hover:bg-gray-50 transition"
            >
              <FiUsers className="mx-auto text-2xl mb-2 text-purple-600" />
              <span className="text-sm font-medium">Add Customer</span>
            </Link>
            <Link
              to="/reports/daily"
              className="p-4 border rounded-lg text-center hover:bg-gray-50 transition"
            >
              <FiCalendar className="mx-auto text-2xl mb-2 text-orange-600" />
              <span className="text-sm font-medium">View Reports</span>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Company Info</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Company:</span>
              <span className="font-medium">{company?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{company?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{company?.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Your Role:</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Version:</span>
              <span className="font-medium capitalize">Gold</span>
            </div>
            
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Sales</h2>
          <Link to="/sales" className="text-blue-600 hover:text-blue-700 text-sm">
            View All
          </Link>
        </div>
        
        {recentSales.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No recent sales</p>
            <Link to="/pos" className="text-blue-600 hover:underline mt-2 inline-block">
              Make your first sale
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-sm">{sale.invoice_number}</td>
                    <td className="px-6 py-3">{sale.customer?.name || 'Walk-in'}</td>
                    <td className="px-6 py-3 text-right">{sale.item_count}</td>
                    <td className="px-6 py-3 text-right font-medium">{formatCurrency(sale.total)}</td>
                    <td className="px-6 py-3 text-right text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;