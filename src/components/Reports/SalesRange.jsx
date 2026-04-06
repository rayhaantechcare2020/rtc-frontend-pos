import React, { useState, useEffect } from 'react';
import { FiCalendar, FiDownload } from 'react-icons/fi';
//import { saveAs } from 'file-saver';
//import { exportSalesRangeXls } from '../../services/reports';
import { reportService } from '../../services/reportService';
import toast from 'react-hot-toast';

const SalesRange = () => {
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('day');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    summary: {
      total_sales: 0,
      total_revenue: 0,
      total_profit: 0,
      average_sale: 0,
      by_payment_method: {}
    },
    breakdown: []
  });

  useEffect(() => {
    fetchSalesRange();
  }, [dateRange, groupBy]);

  const fetchSalesRange = async () => {
    try {
      setLoading(true);
      const response = await reportService.getSalesRange({
        from: dateRange.from,
        to: dateRange.to,
        group_by: groupBy
      });
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Error fetching sales range:', error);
      toast.error('Failed to load sales range');
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
        <h1 className="text-2xl font-bold">Sales Range Report</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow p-2">
            <FiCalendar className="text-gray-500" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-2 py-1 rounded focus:outline-none bg-transparent"
            />
            <span>-</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-2 py-1 rounded focus:outline-none bg-transparent"
            />
          </div>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
          <p className="text-2xl font-bold">{reportData.summary.total_sales}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.total_revenue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Profit</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.summary.total_profit)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Average Sale</p>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(reportData.summary.average_sale)}</p>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Sales Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sales Count</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items Sold</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.breakdown.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 font-medium">{item.period}</td>
                  <td className="px-6 py-4 text-right">{item.count}</td>
                  <td className="px-6 py-4 text-right">{item.items_sold}</td>
                  <td className="px-6 py-4 text-right text-green-600">{formatCurrency(item.revenue)}</td>
                  <td className="px-6 py-4 text-right text-blue-600">{formatCurrency(item.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesRange;