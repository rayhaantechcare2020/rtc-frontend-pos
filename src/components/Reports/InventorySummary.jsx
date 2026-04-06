import React, { useState, useEffect } from 'react';
import { FiPackage, FiAlertCircle, FiDollarSign, FiDownload } from 'react-icons/fi';
import { reportService } from '../../services/reportService';
import toast from 'react-hot-toast';

const InventorySummary = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    total_products: 0,
    total_value: 0,
    low_stock: 0,
    out_of_stock: 0,
    categories: []
  });

  useEffect(() => {
    fetchInventorySummary();
  }, []);

  const normalizeCategory = (category) => {
    if (!category || typeof category !== 'object') {
      return { name: String(category), product_count: 0, category_value: 0 };
    }

    const product_count = Number(category.product_count ?? category.stock_quantity ?? 0);
    const category_value = Number(category.category_value ?? category.stock_quantity ?? 0);

    return {
      name: category.name ?? 'Uncategorized',
      product_count: Number.isNaN(product_count) ? 0 : product_count,
      category_value: Number.isNaN(category_value) ? 0 : category_value,
      ...category
    };
  };

  const fetchInventorySummary = async () => {
    try {
      setLoading(true);
      const response = await reportService.getInventorySummary();
      if (response.success) {
        setReportData((prev) => ({
          ...prev,
          ...response.data,
          low_stock: Array.isArray(response.data.low_stock) ? response.data.low_stock.length : response.data.low_stock,
          out_of_stock: Array.isArray(response.data.out_of_stock) ? response.data.out_of_stock.length : response.data.out_of_stock,
          categories: Array.isArray(response.data.categories) ? response.data.categories.map(normalizeCategory) : []
        }));
      }
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      toast.error('Failed to load inventory summary');
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
        <h1 className="text-2xl font-bold">Inventory Summary</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <FiDownload /> Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-2xl font-bold">{reportData.total_products}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiPackage className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inventory Value</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.total_value)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{reportData.low_stock}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FiAlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{reportData.out_of_stock}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FiAlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Inventory by Category</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Inventory Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.categories.map((category, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 font-medium">{category.name}</td>
                  <td className="px-6 py-4 text-right">{category.product_count}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(category.category_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventorySummary;