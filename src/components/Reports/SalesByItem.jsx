import React, { useState, useEffect, useCallback } from 'react';
import { FiCalendar, FiDownload, FiFilter, FiX } from 'react-icons/fi';
import { reportService } from '../../services/reportService';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const SalesByItem = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [filterItem, setFilterItem] = useState('');
  const [itemsList, setItemsList] = useState([]);
  const [reportData, setReportData] = useState({
    summary: {
      total_items_sold: 0,
      total_revenue: 0,
      total_transactions: 0,
      unique_items: 0
    },
    dailySalesByItem: []
  });

  // Fetch sales data
  const fetchSalesByItem = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error('Please select valid date range');
      return;
    }

    try {
      setLoading(true);
      const response = await reportService.getDailySalesByItem({
        from: dateRange.from,
        to: dateRange.to
      });
      
      if (response.success) {
        setReportData(response.data);
        // Extract unique items for filter dropdown
        const uniqueItems = [...new Set(response.data.dailySalesByItem.map(item => item.item_name))];
        setItemsList(uniqueItems);
      } else {
        toast.error(response.message || 'Failed to load sales data');
      }
    } catch (error) {
      console.error('Error fetching sales by item:', error);
      toast.error(error.response?.data?.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchSalesByItem();
  }, [fetchSalesByItem]);

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '₦0';
    return `₦${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExport = () => {
    try {
      const filteredData = getFilteredData();
      
      if (filteredData.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      // Prepare export data
      const exportData = filteredData.map(item => ({
        'Date': formatDate(item.date),
        'Item Name': item.item_name,
        'Quantity Sold': item.quantity,
        'Unit Price (₦)': item.unit_price?.toFixed(2) || (item.amount / item.quantity)?.toFixed(2) || '0.00',
        'Total Amount (₦)': item.amount?.toFixed(2) || item.revenue?.toFixed(2) || '0.00',
        'Transactions Count': item.transactions_count || 1
      }));

      // Create summary sheet
      const summaryData = [{
        'Report Type': 'Daily Sales by Item',
        'Date Range': `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`,
        'Generated On': new Date().toLocaleString(),
        'Total Items Sold': reportData.summary.total_items_sold?.toLocaleString() || 0,
        'Total Revenue': formatCurrency(reportData.summary.total_revenue),
        'Total Transactions': reportData.summary.total_transactions?.toLocaleString() || 0,
        'Unique Items Sold': reportData.summary.unique_items?.toLocaleString() || 0,
        'Filter Applied': filterItem || 'None'
      }];

      // Create filtered data summary if filter is applied
      if (filterItem) {
        summaryData.push({
          'Report Type': 'Filtered Summary',
          'Item Filtered': filterItem,
          'Filtered Items Sold': getTotalQuantity().toLocaleString(),
          'Filtered Revenue': formatCurrency(getTotalRevenue()),
          'Filtered Records': filteredData.length
        });
      }

      const ws1 = XLSX.utils.json_to_sheet(exportData);
      const ws2 = XLSX.utils.json_to_sheet(summaryData);
      const wb = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(wb, ws1, 'Daily Sales by Item');
      XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
      
      // Auto-size columns for first sheet
      const maxWidth = 50;
      ws1['!cols'] = Object.keys(exportData[0] || {}).map(key => ({ 
        wch: Math.min(Math.max(key.length, 20), maxWidth) 
      }));
      
      const fileName = `daily_sales_by_item_${dateRange.from}_to_${dateRange.to}${filterItem ? `_${filterItem}` : ''}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const getFilteredData = () => {
    if (!filterItem) return reportData.dailySalesByItem;
    return reportData.dailySalesByItem.filter(item => item.item_name === filterItem);
  };

  const getTotalRevenue = () => {
    const filtered = getFilteredData();
    return filtered.reduce((sum, item) => sum + (item.revenue || item.amount || 0), 0);
  };

  const getTotalQuantity = () => {
    const filtered = getFilteredData();
    return filtered.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
  };

  const handleResetFilters = () => {
    setFilterItem('');
  };

  const filteredData = getFilteredData();

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Daily Sales by Item Report
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track daily sales performance for each product
          </p>
        </div>
        <button
          onClick={fetchSalesByItem}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-500" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => handleDateRangeChange('from', e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => handleDateRangeChange('to', e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              <FiFilter className="inline mr-1" /> Filter by Item
            </label>
            <div className="flex gap-2">
              <select
                value={filterItem}
                onChange={(e) => setFilterItem(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">All Items ({itemsList.length} items)</option>
                {itemsList.map((item, index) => (
                  <option key={index} value={item}>{item}</option>
                ))}
              </select>
              {filterItem && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-1"
                  title="Clear filter"
                >
                  <FiX /> Clear
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleExport}
              disabled={filteredData.length === 0}
              className={`bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                filteredData.length === 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700'
              }`}
            >
              <FiDownload /> Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-transform hover:scale-105">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Items Sold</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {getTotalQuantity().toLocaleString()}
          </p>
          {filterItem && (
            <p className="text-xs text-blue-500 mt-1 truncate">
              Filtered: {filterItem}
            </p>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-transform hover:scale-105">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(getTotalRevenue())}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-transform hover:scale-105">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-600">
            {reportData.summary.total_transactions?.toLocaleString() || 0}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-transform hover:scale-105">
          <p className="text-sm text-gray-600 dark:text-gray-400">Unique Items Sold</p>
          <p className="text-2xl font-bold text-purple-600">
            {filterItem ? 1 : (reportData.summary.unique_items?.toLocaleString() || 0)}
          </p>
          {filterItem && (
            <p className="text-xs text-gray-500 mt-1">Filtered view</p>
          )}
        </div>
      </div>

      {/* Daily Sales by Item Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Daily Sales Breakdown by Item
          </h2>
          <div className="text-sm text-gray-500">
            Showing {filteredData.length} of {reportData.dailySalesByItem.length} records
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price (₦)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount without Discount (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No sales data found for the selected criteria
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {item.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900 dark:text-white">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 dark:text-gray-400">
                      {formatCurrency(item.unit_price || (item.amount / item.quantity))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-semibold">
                      {formatCurrency(item.revenue || item.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-gray-700 font-semibold">
                <tr>
                  <td colSpan="2" className="px-6 py-3 text-right">Total:</td>
                  <td className="px-6 py-3 text-right">{getTotalQuantity().toLocaleString()}</td>
                  <td className="px-6 py-3 text-right"></td>
                  <td className="px-6 py-3 text-right text-green-600">{formatCurrency(getTotalRevenue())}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesByItem;