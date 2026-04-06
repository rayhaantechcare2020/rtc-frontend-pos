import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiAlertCircle, 
  FiPackage, 
  FiSearch, 
  FiRefreshCw,
  FiShoppingCart,
  FiTruck,
  FiDownload
} from 'react-icons/fi';
import { productService } from '../../services/products';
import { reportService } from '../../services/reportService';
import { exportToExcel, formatLowStockData } from '../../utils/excelExport';
import toast from 'react-hot-toast';

const LowStock = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState({
    low_stock: 0,
    out_of_stock: 0,
    total_value: 0
  });

  useEffect(() => {
    fetchLowStock();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [search, products]);

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      
      // Fetch all products
      const productsRes = await productService.getProducts({ per_page: 100 });
      let productsData = [];
      if (productsRes?.data) {
        if (Array.isArray(productsRes.data)) {
          productsData = productsRes.data;
        } else if (productsRes.data.data) {
          productsData = productsRes.data.data;
        }
      }

      // Filter low stock and out of stock products
      const lowStockProducts = productsData.filter(p => 
        p.stock_quantity <= (p.low_stock_threshold || 5)
      );
      
      setProducts(lowStockProducts);
      setFilteredProducts(lowStockProducts);

      // Calculate summary
      const lowCount = lowStockProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5)).length;
      const outCount = lowStockProducts.filter(p => p.stock_quantity <= 0).length;
      const totalValue = lowStockProducts.reduce((sum, p) => sum + (p.stock_quantity * (p.cost || 0)), 0);

      setSummary({
        low_stock: lowCount,
        out_of_stock: outCount,
        total_value: totalValue
      });

    } catch (error) {
      console.error('Error fetching low stock:', error);
      toast.error('Failed to load low stock items');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!search) {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(p => 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const dataToExport = filteredProducts.length > 0 ? filteredProducts : products;
      
      if (dataToExport.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      const exportData = formatLowStockData(dataToExport, formatCurrency);
      const success = exportToExcel(exportData, 'low_stock', 'Low Stock Items');
      
      if (success) {
        toast.success(`Exported ${exportData.length} items to Excel`);
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

  const getStockLevel = (product) => {
    if (product.stock_quantity <= 0) {
      return { level: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: '🔴' };
    } else if (product.stock_quantity <= 2) {
      return { level: 'Critical', color: 'bg-red-200 text-red-900', icon: '⚠️' };
    } else if (product.stock_quantity <= (product.low_stock_threshold || 5)) {
      return { level: 'Low', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' };
    }
    return { level: 'Normal', color: 'bg-green-100 text-green-800', icon: '✅' };
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
        <div className="flex items-center gap-3">
          <FiAlertCircle className="text-orange-500 text-3xl" />
          <h1 className="text-2xl font-bold">Low Stock Alert</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLowStock}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.low_stock}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{summary.out_of_stock}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total at Risk Value</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.total_value)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search low stock items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No low stock items found</p>
            <p className="text-sm text-gray-400 mt-2">All products have adequate stock levels</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Threshold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value at Risk</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                 </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockLevel = getStockLevel(product);
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{product.name}</td>
                      <td className="px-6 py-4 font-mono text-sm">{product.sku || '-'}</td>
                      <td className="px-6 py-4 text-right font-bold">
                        <span className={
                          product.stock_quantity <= 0 ? 'text-red-600' : 'text-orange-600'
                        }>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">{product.low_stock_threshold || 5}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${stockLevel.color}`}>
                          {stockLevel.icon} {stockLevel.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency(product.stock_quantity * (product.cost || 0))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/direct-receive?product=${product.id}`}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                          >
                            <FiTruck /> Receive
                          </Link>
                          <Link
                            to={`/inventory/adjustments?product=${product.id}`}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Adjust
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="4" className="px-6 py-3 text-right font-bold">Total Items at Risk:</td>
                  <td className="px-6 py-3 font-bold">{filteredProducts.length}</td>
                  <td className="px-6 py-3 text-right font-bold text-orange-600">
                    {formatCurrency(filteredProducts.reduce((sum, p) => sum + (p.stock_quantity * (p.cost || 0)), 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/direct-receive"
          className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-between"
        >
          <div>
            <h3 className="font-semibold">Receive Stock</h3>
            <p className="text-sm opacity-90">Add new inventory from suppliers</p>
          </div>
          <FiTruck size={24} />
        </Link>
        <Link
          to="/inventory/adjustments"
          className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-between"
        >
          <div>
            <h3 className="font-semibold">Stock Adjustment</h3>
            <p className="text-sm opacity-90">Adjust inventory levels</p>
          </div>
          <FiPackage size={24} />
        </Link>
      </div>
    </div>
  );
};

export default LowStock;