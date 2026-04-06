import React, { useState, useEffect } from 'react';
import { FiUsers, FiDollarSign, FiShoppingBag, FiDownload } from 'react-icons/fi';
import { reportService } from '../../services/reportService';
import toast from 'react-hot-toast';

const CustomerSummary = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    summary: {
      total_customers: 0,
      total_receivables: 0,
      average_spent: 0
    },
    customers: []
  });

  useEffect(() => {
    fetchCustomerSummary();
  }, []);

  const fetchCustomerSummary = async () => {
    try {
      setLoading(true);
      const response = await reportService.getCustomerSummary();
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Error fetching customer summary:', error);
      toast.error('Failed to load customer summary');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return `₦${Number(value).toLocaleString()}`;
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
        <h1 className="text-2xl font-bold">Customer Summary</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <FiDownload /> Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-2xl font-bold">{reportData.summary.total_customers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Receivables</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(reportData.summary.total_receivables)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FiDollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Spent</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.average_spent)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiShoppingBag className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Customer List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Purchases</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Last Purchase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 font-medium">{customer.name}</td>
                  <td className="px-6 py-4">{customer.phone || '-'}</td>
                  <td className="px-6 py-4 text-right">{customer.total_purchases}</td>
                  <td className="px-6 py-4 text-right text-green-600">{formatCurrency(customer.total_spent)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={customer.balance > 0 ? 'text-orange-600 font-medium' : ''}>
                      {formatCurrency(customer.balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerSummary;