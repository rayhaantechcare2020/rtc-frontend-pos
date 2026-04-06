import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch, 
  FiDownload,
  FiUpload
} from 'react-icons/fi';
import { productService } from '../../services/products';
import { exportToExcel, formatProductsData } from '../../utils/excelExport';
import toast from 'react-hot-toast';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [search, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProducts();
      //console.log('Products response:', response);
      
      let productsData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          productsData = response.data.data;
        }
      }
      
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load products');
      toast.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!search) {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(product =>
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      await productService.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const dataToExport = filteredProducts.length > 0 ? filteredProducts : products;
      
      if (dataToExport.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      // Format data for export
      const exportData = formatProductsData(dataToExport, formatCurrency);
      
      // Export to Excel
      const success = exportToExcel(exportData, 'products', 'Products');
      
      if (success) {
        toast.success(`Exported ${exportData.length} products to Excel`);
      } else {
        toast.error('Failed to export to Excel');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  // Format currency function
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <Link
            to="/import/products"
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <FiUpload /> Import
          </Link>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <FiDownload /> {exporting ? 'Exporting...' : 'Export'}
          </button>
          <Link
            to="/products/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FiPlus /> Add Product
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
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
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No products found</p>
            {search && (
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your search
              </p>
            )}
            {!search && (
              <Link
                to="/products/new"
                className="inline-block mt-4 text-blue-600 hover:text-blue-700"
              >
                Add your first product
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium">{product.name} </td>
                    <td className="px-6 py-4 font-mono text-sm">{product.sku || '-'} </td>
                    <td className="px-6 py-4 text-right">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={
                        product.stock_quantity <= (product.low_stock_threshold || 5) 
                          ? 'text-orange-600 font-medium' 
                          : ''
                      }>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/products/${product.id}`}
                        className="text-blue-600 hover:text-blue-800 mr-3 inline-block"
                        title="Edit Product"
                      >
                        <FiEdit2 />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Product"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Info */}
      {filteredProducts.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          {filteredProducts.length} product(s) shown
        </div>
      )}
    </div>
  );
};

export default ProductList;