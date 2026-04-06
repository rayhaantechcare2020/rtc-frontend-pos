import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiDownload,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiRefreshCw
} from 'react-icons/fi';
import { saleService } from '../../services/sale';
import { exportToExcel, formatProfitLossData } from '../../utils/excelExport';
import toast from 'react-hot-toast';

const ProfitLoss = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    period: { from: '', to: '' },
    summary: {
      revenue: 0,
      cogs: 0,
      gross_profit: 0,
      gross_margin: 0
    },
    revenue_breakdown: []
  });

  useEffect(() => {
    fetchProfitLoss();
  }, [dateRange]);

  const fetchProfitLoss = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error('Please select both from and to dates');
      return;
    }

    try {
      setLoading(true);
      const response = await saleService.getProfitLoss(dateRange.from, dateRange.to);
      //console.log('Profit & Loss API Response:', response);
      
      if (response.success) {
        // Handle different possible response structures
        const data = response.data || {};
        
        setReportData({
          period: {
            from: data.period?.from || dateRange.from,
            to: data.period?.to || dateRange.to
          },
          summary: {
            revenue: data.summary?.revenue || data.total_revenue || 0,
            cogs: data.summary?.cogs || data.total_cost || 0,
            gross_profit: data.summary?.gross_profit || data.total_profit || 0,
            gross_margin: data.summary?.gross_margin || 0
          },
          revenue_breakdown: data.revenue_breakdown || []
        });
      } else {
        toast.error(response.message || 'Failed to load profit & loss');
      }
    } catch (error) {
      console.error('Error fetching profit & loss:', error);
      toast.error(error.response?.data?.message || 'Failed to load profit & loss');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const summaryData = [
        { 'Metric': 'Period From', 'Value': reportData.period.from },
        { 'Metric': 'Period To', 'Value': reportData.period.to },
        { 'Metric': 'Revenue', 'Value': formatCurrency(reportData.summary.revenue) },
        { 'Metric': 'Cost of Goods Sold', 'Value': formatCurrency(reportData.summary.cogs) },
        { 'Metric': 'Gross Profit', 'Value': formatCurrency(reportData.summary.gross_profit) },
        { 'Metric': 'Gross Margin (%)', 'Value': reportData.summary.gross_margin }
      ];
      
      const breakdownData = reportData.revenue_breakdown.map(item => ({
        'Category': item.name || 'Uncategorized',
        'Revenue': formatCurrency(item.revenue),
        '% of Total': reportData.summary.revenue ? ((item.revenue / reportData.summary.revenue) * 100).toFixed(1) : 0
      }));
      
      const success1 = exportToExcel(summaryData, 'profit_loss_summary', 'Summary');
      const success2 = exportToExcel(breakdownData, 'profit_loss_breakdown', 'Breakdown');
      
      if (success1 && success2) {
        toast.success('Profit & Loss report exported successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '₦0';
    }
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
        <h1 className="text-2xl font-bold">Profit & Loss</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchProfitLoss}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiRefreshCw /> Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FiDownload /> {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <FiCalendar className="text-gray-500" />
          <div className="flex items-center gap-2">
            <label className="font-medium">From:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium">To:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchProfitLoss}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.revenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">COGS</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.summary.cogs)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FiTrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gross Profit</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.summary.gross_profit)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiTrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gross Margin</p>
              <p className="text-2xl font-bold text-purple-600">{reportData.summary.gross_margin}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FiDollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* P&L Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main P&L */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Profit & Loss Statement</h2>
            <p className="text-sm text-gray-500 mb-4">
              Period: {reportData.period.from ? new Date(reportData.period.from).toLocaleDateString() : '-'} - {reportData.period.to ? new Date(reportData.period.to).toLocaleDateString() : '-'}
            </p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-lg text-green-600">{formatCurrency(reportData.summary.revenue)}</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b text-red-600">
                <span>Cost of Goods Sold (COGS)</span>
                <span className="font-semibold">-{formatCurrency(reportData.summary.cogs)}</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b font-medium">
                <span>Gross Profit</span>
                <span className="text-green-600">{formatCurrency(reportData.summary.gross_profit)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 text-lg font-bold">
                <span>Net Profit</span>
                <span className="text-green-600">{formatCurrency(reportData.summary.gross_profit)}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>Gross Margin</span>
                <span className="font-medium">{reportData.summary.gross_margin}%</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>Net Margin</span>
                <span className="font-medium">{reportData.summary.gross_margin}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Revenue by Category</h2>
            {!reportData.revenue_breakdown || reportData.revenue_breakdown.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No category data available</p>
            ) : (
              <div className="space-y-4">
                {reportData.revenue_breakdown.map((item, index) => {
                  const percentage = reportData.summary.revenue > 0 
                    ? ((item.revenue / reportData.summary.revenue) * 100).toFixed(1) 
                    : 0;
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate">{item.name || 'Uncategorized'}</span>
                        <span className="font-medium ml-2">{formatCurrency(item.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss;