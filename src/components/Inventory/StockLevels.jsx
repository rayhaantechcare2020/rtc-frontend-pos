import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPackage, 
  FiSearch, 
  FiEdit2, 
  FiAlertCircle, 
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { productService } from '../../services/products';
import { categoryService } from '../../services/category';
import { reportService } from '../../services/reportService';
import { exportToExcel, formatStockData } from '../../utils/excelExport';
import toast from 'react-hot-toast';

const StockLevels = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState({
    total_products: 0,
    total_value: 0,
    low_stock: 0,
    out_of_stock: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]); // Add this for low stock items array

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [search, categoryFilter, stockFilter, products]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const productsRes = await productService.getProducts({ per_page: 100 });
      let productsData = [];
      if (productsRes?.data) {
        if (Array.isArray(productsRes.data)) {
          productsData = productsRes.data;
        } else if (productsRes.data.data) {
          productsData = productsRes.data.data;
        }
      }
      setProducts(productsData);
      
      // Calculate low stock items from products data
      const lowStock = productsData.filter(p => 
        p.stock_quantity <= (p.low_stock_threshold || 5) && p.stock_quantity > 0
      );
      setLowStockItems(lowStock);

      // Fetch categories
      const categoriesRes = await categoryService.getCategories();
      if (categoriesRes?.success) {
        setCategories(categoriesRes.data || []);
      }

      // Fetch inventory summary
      const summaryRes = await reportService.getInventorySummary();
      if (summaryRes?.success) {
        setSummary({
          total_products: summaryRes.data?.total_products || productsData.length,
          total_value: summaryRes.data?.total_value || 0,
          low_stock: lowStock.length,
          out_of_stock: productsData.filter(p => p.stock_quantity <= 0).length
        });
      }

    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (search) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category_id === parseInt(categoryFilter));
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(p => p.stock_quantity <= (p.low_stock_threshold || 5) && p.stock_quantity > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(p => p.stock_quantity <= 0);
    } else if (stockFilter === 'in') {
      filtered = filtered.filter(p => p.stock_quantity > 0);
    }

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
      
      const exportData = formatStockData(dataToExport, formatCurrency);
      const success = exportToExcel(exportData, 'stock_levels', 'Stock Levels');
      
      if (success) {
        toast.success(`Exported ${exportData.length} products to Excel`);
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

  const getStockStatus = (product) => {
    if (product.stock_quantity <= 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (product.stock_quantity <= (product.low_stock_threshold || 5)) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
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
        <h1 className="text-2xl font-bold">Stock Levels</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <FiRefreshCw /> Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FiDownload /> {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-2xl font-bold">{summary.total_products}</p>
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
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_value)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiPackage className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.low_stock}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiAlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{summary.out_of_stock}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FiAlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Items Section */}
      {lowStockItems.length > 0 && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <FiAlertCircle /> Low Stock Alert ({lowStockItems.length} items)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">Stock: {item.stock_quantity}</p>
                  <p className="text-sm text-orange-600">
                    Threshold: {item.low_stock_threshold || 5}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('all');
              setStockFilter('all');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
          >
            <FiFilter /> Reset
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Threshold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  const isExpanded = expandedProduct === product.id;
                  
                  return (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                            <span className="font-medium">{product.name}</span>
                          </div>
                         </td>
                        <td className="px-6 py-4 font-mono text-sm">{product.sku || '-'}</td>
                        <td className="px-6 py-4 text-right font-medium">
                          <span className={
                            product.stock_quantity <= (product.low_stock_threshold || 5)
                              ? 'text-orange-600'
                              : product.stock_quantity <= 0
                                ? 'text-red-600'
                                : 'text-green-600'
                          }>
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">{product.low_stock_threshold || 5}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(product.stock_quantity * (product.cost || 0))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/inventory/adjustments?product=${product.id}`}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            Adjust
                          </Link>
                          <Link
                            to={`/products/${product.id}`}
                            className="text-green-600 hover:text-green-800"
                          >
                            <FiEdit2 />
                          </Link>
                        </td>
                      </tr>
                      
                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan="7" className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-medium mb-2">Product Details</p>
                              {product.description && (
                                <p className="text-gray-600 mb-2">{product.description}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Created: {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockLevels;