import React, { useState, useEffect } from 'react';
import { FiUser, FiCalendar, FiDollarSign, FiShoppingBag, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { saleService } from '../../services/sale';
import { userService } from '../../services/user';
import toast from 'react-hot-toast';

const CashierSales = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState('invoice');
  const [summary, setSummary] = useState({
    total_sales: 0,
    total_revenue: 0,
    total_items: 0,
    avg_sale: 0
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15
  });

  useEffect(() => {
    fetchCashiers();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [date, selectedCashier, pagination.current_page]);

  const fetchCashiers = async () => {
    try {
      const response = await userService.getUsers();
      if (response.success) {
        const cashierUsers = (response.data || []).filter(u => u.role === 'staff' || u.role === 'admin');
        setCashiers(cashierUsers);
      }
    } catch (error) {
      console.error('Error fetching cashiers:', error);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current_page,
        per_page: pagination.per_page,
        sale_date: date
      };
      
      if (selectedCashier !== 'all') {
        params.user_id = selectedCashier;
      }
      
      if (search) {
        if (searchType === 'invoice') {
          params.search = search;
        } else if (searchType === 'amount') {
          params.search_amount = parseFloat(search);
        }
      }
      
      const response = await saleService.getSales(params);
      //console.log('API Response:', response); // Debug log
      
      if (response.success) {
        // Access the data correctly - handle different response structures
        let sales = [];
        if (response.data?.data) {
          sales = response.data.data;
        } else if (Array.isArray(response.data)) {
          sales = response.data;
        } else {
          sales = [];
        }
        
        setSalesData(sales);
        
        // Calculate summary from the actual sales data
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalItems = sales.reduce((sum, sale) => sum + (sale.item_count || 0), 0);
        
        setSummary({
          total_sales: totalSales,
          total_revenue: totalRevenue,
          total_items: totalItems,
          avg_sale: totalSales > 0 ? totalRevenue / totalSales : 0
        });
        
        // Update pagination if available
        if (response.data) {
          setPagination({
            current_page: response.data.current_page || pagination.current_page,
            last_page: response.data.last_page || pagination.last_page,
            total: response.data.total || 0,
            per_page: response.data.per_page || 15
          });
        }
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleClearSearch = () => {
    setSearch('');
    setSearchType('invoice');
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '₦0';
    }
    return `₦${Number(value).toLocaleString()}`;
  };

  const getCashierName = (userId) => {
    const cashier = cashiers.find(c => c.id === userId);
    return cashier?.name || `User #${userId}`;
  };

  if (loading && salesData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cashier Sales Report</h1>
        <button
          onClick={fetchSales}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Selector */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-3 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Cashier Selector */}
          <div className="relative">
            <FiUser className="absolute left-3 top-3 text-gray-400" />
            <select
              value={selectedCashier}
              onChange={(e) => setSelectedCashier(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cashiers</option>
              {cashiers.map(cashier => (
                <option key={cashier.id} value={cashier.id}>{cashier.name}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="invoice">Invoice #</option>
              <option value="amount">Amount</option>
            </select>
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type={searchType === 'amount' ? 'number' : 'text'}
                placeholder={searchType === 'invoice' ? "Search invoice..." : "Enter exact amount"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {search && (
              <button
                onClick={handleClearSearch}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold">{summary.total_sales}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_revenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Items Sold</p>
              <p className="text-2xl font-bold text-blue-600">{summary.total_items}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Sale</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.avg_sale)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FiDollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {salesData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No sales found for this date</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                 </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salesData.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{sale.sale_time || new Date(sale.created_at).toLocaleTimeString()}</td>
                      <td className="px-6 py-4 font-mono text-sm">{sale.invoice_number}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1">
                          <FiUser className="text-gray-400" size={14} />
                          {getCashierName(sale.user_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{sale.customer?.name || 'Walk-in'}</td>
                      <td className="px-6 py-4 text-right">{sale.item_count}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="px-6 py-4 capitalize">{sale.payments?.[0]?.payment_method || 'cash'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td colSpan="5" className="px-6 py-3 text-right font-bold">Total:</td>
                    <td className="px-6 py-3 text-right font-bold text-green-600">
                      {formatCurrency(salesData.reduce((sum, s) => sum + (s.total || 0), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                    disabled={pagination.current_page === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CashierSales;