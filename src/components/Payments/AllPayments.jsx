import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiSearch, 
  FiCalendar, 
  FiDownload,
  FiEye,
  FiFilter,
  FiX
} from 'react-icons/fi';
import { paymentService } from '../../services/payment';
import { exportToExcel, formatAllPaymentsData } from '../../utils/excelExport';
import {customerService} from '../../services/customer';   
import toast from 'react-hot-toast';

const AllPayments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [methodFilter, setMethodFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total_amount: 0,
    total_count: 0,
    by_method: {}
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [search, dateRange, methodFilter, payments]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAllPayments({ per_page: 100 });
      if (response.success) {
        const paymentsData = response.data?.data || [];
        setPayments(paymentsData);
        calculateStats(paymentsData);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData) => {
    const total_amount = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0);
    const by_method = paymentsData.reduce((acc, p) => {
      const method = p.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + (p.amount || 0);
      return acc;
    }, {});

    setStats({
      total_amount,
      total_count: paymentsData.length,
      by_method
    });
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (search) {
      filtered = filtered.filter(p => 
        p.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.reference?.toLowerCase().includes(search.toLowerCase()) ||
        p.sale?.invoice_number?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(p => new Date(p.payment_date) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      filtered = filtered.filter(p => new Date(p.payment_date) <= new Date(dateRange.to));
    }

    // Method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_method === methodFilter);
    }

    setFilteredPayments(filtered);
  };

  const handleExport = () => {
    const exportData = filteredPayments.map(p => ({
      'Date': p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-',
      'Customer': p.customer?.name || 'N/A',
      'Customer Phone': p.customer?.phone || '-',
      'Invoice': p.sale?.invoice_number || '-',
      'Method': p.payment_method || '-',
      'Amount (₦)': p.amount || 0,
      'Reference': p.reference || '-',
      'Status': p.status || 'completed',
      'Recorded By': p.user?.name || 'System'
    }));

    exportToExcel(exportData, 'all_payments', 'Payments');
    toast.success(`Exported ${exportData.length} payments`);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '₦0';
    }
    return `₦${Number(value).toLocaleString()}`;
  };

  const getMethodIcon = (method) => {
    switch(method?.toLowerCase()) {
      case 'cash': return '💵';
      case 'transfer': return '🏦';
      case 'pos': return '💳';
      case 'cheque': return '📝';
      default: return '💰';
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDateRange({ from: '', to: '' });
    setMethodFilter('all');
  };

  if (loading) {
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
        <h1 className="text-2xl font-bold">All Payments</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <FiFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-2xl font-bold">{stats.total_count}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_amount)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Average Payment</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats.total_count ? stats.total_amount / stats.total_count : 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Payment Methods</p>
          <p className="text-2xl font-bold text-purple-600">{Object.keys(stats.by_method).length}</p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search customer/reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date From */}
            <div className="relative">
              <FiCalendar className="absolute left-3 top-3 text-gray-400" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="From date"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <FiCalendar className="absolute left-3 top-3 text-gray-400" />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="To date"
              />
            </div>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="pos">POS</option>
              <option value="cheque">Cheque</option>
            </select>

            {/* Reset Button */}
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
            >
              <FiX /> Reset
            </button>
          </div>
        </div>
      )}

      
    {/* Payments Table */}
<div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
  {filteredPayments.length === 0 ? (
    <div className="text-center py-12">
      <p className="text-gray-500">No payments found</p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredPayments.map((payment) => {
            // Determine customer name with fallbacks
            let customerName = 'Unknown Customer';
            let customerId = null;
            let customerPhone = null;
            
            if (payment.customer) {
              customerName = payment.customer.name || 'Unnamed Customer';
              customerId = payment.customer.id;
              customerPhone = payment.customer.phone;
            } else if (payment.customer_name) {
              customerName = payment.customer_name;
            } else if (payment.sale?.customer?.name) {
              customerName = payment.sale.customer.name;
              customerId = payment.sale.customer.id;
            }
            
            return (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                </td>
                
                <td className="px-6 py-4">
                {(() => {
                    // Try to get customer from various sources
                    let customerName = 'Unknown Customer';
                    let customerId = null;
                    let customerPhone = null;
                    
                    // Source 1: Direct customer relationship
                    if (payment.customer) {
                    customerName = payment.customer.name || 'Unknown Customer';
                    customerId = payment.customer.id;
                    customerPhone = payment.customer.phone;
                    } 
                    // Source 2: Customer from sale
                    else if (payment.sale?.customer) {
                    customerName = payment.sale.customer.name || 'Unknown Customer';
                    customerId = payment.sale.customer.id;
                    customerPhone = payment.sale.customer.phone;
                    }
                    // Source 3: Customer name field (if you have it)
                    else if (payment.customer_name) {
                    customerName = payment.customer_name;
                    }
                    
                    return customerId ? (
                    <Link 
                        to={`/customers/${customerId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        {customerName}
                    </Link>
                    ) : (
                    <span className="text-gray-700">{customerName}</span>
                    );
                })()}
            </td>
                <td className="px-6 py-4 text-sm">
                  {customerPhone || payment.customer?.phone || payment.sale?.customer?.phone || '-'}
                </td>
                <td className="px-6 py-4">
                  {payment.sale ? (
                    <Link 
                      to={`/sales/${payment.sale.id}`}
                      className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                    >
                      {payment.sale.invoice_number || '-'}
                    </Link>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1">
                    <span>{getMethodIcon(payment.payment_method)}</span>
                    <span className="capitalize">{payment.payment_method || 'unknown'}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-green-600">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-6 py-4 text-sm">{payment.reference || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payment.status === 'reversed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.status || 'completed'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {customerId && (
                    <Link
                      to={`/customers/${customerId}/payments`}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Customer Payments"
                    >
                      <FiEye size={18} />
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50 font-medium">
          <tr>
            <td colSpan="5" className="px-6 py-3 text-right">Total:</td>
            <td className="px-6 py-3 text-right text-green-600">
              {formatCurrency(filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0))}
            </td>
            <td colSpan="3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )}
</div>
    </div>
  );
};

export default AllPayments;