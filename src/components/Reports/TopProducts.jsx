import React, { useState, useEffect } from 'react';
import { FiCalendar, FiDownload, FiTrendingUp } from 'react-icons/fi';
import { saleService } from '../../services/sale';
import { reportService } from '../../services/reportService';
import toast from 'react-hot-toast';

const TopProducts = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    period: { from: '', to: '' },
    total_revenue: 0,
    total_profit: 0,
    products: []
  });

  useEffect(() => {
    fetchTopProducts();
  }, [dateRange]);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      const response = await reportService.getTopProducts({
        from: dateRange.from,
        to: dateRange.to,
        limit: 20
      });
      if (response.success) {
        const payload = response.data;

        if (Array.isArray(payload)) {
          const totalRevenue = payload.reduce((sum, p) => sum + Number(p.total_revenue || 0), 0);
          const totalProfit = payload.reduce((sum, p) => sum + Number(p.total_profit || 0), 0);

          setReportData({
            period: { from: dateRange.from, to: dateRange.to },
            total_revenue: totalRevenue,
            total_profit: totalProfit,
            products: payload
          });
        } else {
          setReportData({
            period: payload.period || { from: dateRange.from, to: dateRange.to },
            total_revenue: payload.total_revenue || 0,
            total_profit: payload.total_profit || 0,
            products: payload.products || []
          });
        }
      } else {
        toast.error(response.message || 'Failed to load top products');
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
      toast.error('Failed to load top products');
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
        <h1 className="text-2xl font-bold">Top Products</h1>
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
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.total_revenue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Profit</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.total_profit)}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Top Selling Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.products.map((product, index) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 font-medium">{index + 1}</td>
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4 font-mono text-sm">{product.sku || '-'}</td>
                  <td className="px-6 py-4 text-right font-medium">{product.total_quantity}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(product.total_revenue)}</td>
                  <td className="px-6 py-4 text-right text-green-600">{formatCurrency(product.total_profit)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.profit_margin > 30 ? 'bg-green-100 text-green-800' :
                      product.profit_margin > 15 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.profit_margin}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{product.revenue_percentage}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${product.revenue_percentage}%` }}
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
    </div>
  );
};

export default TopProducts;