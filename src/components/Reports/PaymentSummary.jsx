import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiDownload,
  FiDollarSign,
  FiTrendingUp,
  FiPieChart
} from 'react-icons/fi';
import { paymentService } from '../../services/payment';
import { exportToExcel } from '../../utils/excelExport';
import toast from 'react-hot-toast';

const PaymentSummary = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchSummary();
  }, [dateRange]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentSummary(dateRange.from, dateRange.to);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      toast.error('Failed to load payment summary');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!summary) return;

    const summaryData = [
      { 'Metric': 'Period From', 'Value': summary.period.from },
      { 'Metric': 'Period To', 'Value': summary.period.to },
      { 'Metric': 'Total Payments', 'Value': summary.total_payments },
      { 'Metric': 'Total Amount', 'Value': summary.total_amount }
    ];

    const methodData = Object.entries(summary.by_method || {}).map(([method, data]) => ({
      'Payment Method': method,
      'Transactions': data.count,
      'Amount': data.amount
    }));

    const customerData = Object.entries(summary.by_customer || {}).map(([id, data]) => ({
      'Customer': data.customer_name,
      'Payments': data.count,
      'Total Paid': data.amount
    }));

    exportToExcel(summaryData, 'payment_summary', 'Summary');
    if (methodData.length) exportToExcel(methodData, 'payment_methods', 'Methods');
    if (customerData.length) exportToExcel(customerData, 'top_customers', 'Top Customers');
    
    toast.success('Summary exported');
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
        <h1 className="text-2xl font-bold">Payment Summary</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow p-2">
            <FiCalendar className="text-gray-500" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              className="px-2 py-1 border rounded focus:outline-none"
            />
            <span>-</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              className="px-2 py-1 border rounded focus:outline-none"
            />
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Payments</p>
                  <p className="text-3xl font-bold">{summary.total_payments}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiTrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(summary.total_amount)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FiDollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Average Payment</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(summary.total_payments ? summary.total_amount / summary.total_payments : 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FiPieChart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold p-6 border-b">Payment Methods</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(summary.by_method || {}).map(([method, data]) => (
                    <tr key={method}>
                      <td className="px-6 py-4 font-medium capitalize">{method}</td>
                      <td className="px-6 py-4 text-right">{data.count}</td>
                      <td className="px-6 py-4 text-right text-green-600">{formatCurrency(data.amount)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{((data.amount / summary.total_amount) * 100).toFixed(1)}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(data.amount / summary.total_amount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold p-6 border-b">Top Paying Customers</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payments</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(summary.by_customer || {}).map(([id, data]) => (
                    <tr key={id}>
                      <td className="px-6 py-4 font-medium">{data.customer_name}</td>
                      <td className="px-6 py-4 text-right">{data.count}</td>
                      <td className="px-6 py-4 text-right text-green-600">{formatCurrency(data.amount)}</td>
                      <td className="px-6 py-4 text-right">
                        {((data.amount / summary.total_amount) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentSummary;