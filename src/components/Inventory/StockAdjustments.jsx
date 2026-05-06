import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiSave, 
  FiX, 
  FiSearch,
  FiPackage,
  FiAlertCircle,
  FiPlus,
  FiMinus,
  FiRefreshCw
} from 'react-icons/fi';
import { productService } from '../../services/products';
import toast from 'react-hot-toast';

const StockAdjustments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedProduct = queryParams.get('product');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [recentAdjustments, setRecentAdjustments] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchRecentAdjustments();
  }, []);

  useEffect(() => {
    if (preselectedProduct && products.length > 0) {
      const product = products.find(p => p.id === parseInt(preselectedProduct));
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [preselectedProduct, products]);

  useEffect(() => {
    filterProducts();
  }, [search, products]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts({ per_page: 100 });
      let productsData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (response.data.data) {
          productsData = response.data.data;
        }
      }
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAdjustments = async () => {
    try {
      // Try to fetch from API if available
      const response = await productService.getStockAdjustments?.();
      if (response?.data) {
        setRecentAdjustments(response.data);
      } else {
        // Mock data as fallback
        setRecentAdjustments([
          { id: 1, product_name: 'Product A', type: 'add', quantity: 10, old_stock: 45, new_stock: 55, reason: 'Stock count', created_at: '2024-03-16', user: { name: 'Admin' } },
          { id: 2, product_name: 'Product B', type: 'subtract', quantity: 5, old_stock: 30, new_stock: 25, reason: 'Damaged', created_at: '2024-03-15', user: { name: 'Admin' } },
          { id: 3, product_name: 'Product C', type: 'set', quantity: 20, old_stock: 15, new_stock: 20, reason: 'Correction', created_at: '2024-03-14', user: { name: 'Admin' } },
        ]);
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    }
  };

  const filterProducts = () => {
    if (!search) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const calculateNewStock = () => {
    if (!selectedProduct) return null;
    
    const currentQty = selectedProduct.stock_quantity || 0;
    const qty = parseInt(quantity);
    
    if (isNaN(qty)) return null;
    
    switch (adjustmentType) {
      case 'add':
        return currentQty + qty;
      case 'subtract':
        return currentQty - qty;
      case 'set':
        return qty;
      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    const qty = parseInt(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity greater than 0');
      return;
    }

    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    // Validate subtract operation doesn't go negative
    if (adjustmentType === 'subtract') {
      const currentQty = selectedProduct.stock_quantity || 0;
      if (qty > currentQty) {
        toast.error(`Cannot remove ${qty} items. Current stock is only ${currentQty}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      // Call the API with the correct parameters based on backend expectations
      // Backend expects: { quantity: integer, type: 'add'|'subtract'|'set' }
      await productService.updateStock(selectedProduct.id, qty, adjustmentType);
      
      toast.success(`Stock ${adjustmentType === 'add' ? 'added' : adjustmentType === 'subtract' ? 'removed' : 'set'} successfully`);
      
      // Reset form
      setSelectedProduct(null);
      setQuantity('');
      setReason('');
      setNotes('');
      setSearch('');
      setAdjustmentType('add');
      
      // Refresh data
      await fetchProducts();
      await fetchRecentAdjustments();
      
    } catch (error) {
      console.error('Error adjusting stock:', error);
      
      // Display detailed error message
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.values(errors).flat().forEach(err => toast.error(err));
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to adjust stock');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getAdjustmentTypeColor = (type) => {
    switch(type) {
      case 'add': return 'text-green-600';
      case 'subtract': return 'text-red-600';
      case 'set': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getAdjustmentTypeIcon = (type) => {
    switch(type) {
      case 'add': return <FiPlus className="inline mr-1" size={14} />;
      case 'subtract': return <FiMinus className="inline mr-1" size={14} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const newStockValue = calculateNewStock();
  const currentStock = selectedProduct?.stock_quantity || 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stock Adjustments</h1>
        <button
          onClick={() => navigate('/inventory/stock')}
          className="text-gray-600 hover:text-gray-800"
        >
          <FiX size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adjustment Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">New Adjustment</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Product *</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {search && filteredProducts.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(product);
                        setSearch('');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-gray-500 ml-2">SKU: {product.sku || 'N/A'}</span>
                      </div>
                      <span className="text-sm text-gray-500">Stock: {product.stock_quantity || 0}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedProduct && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current Stock: <span className="font-bold">{currentStock}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    SKU: {selectedProduct.sku || 'N/A'}
                  </p>
                  {selectedProduct.price && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Price: ₦{Number(selectedProduct.price).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Adjustment Type *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('add')}
                  className={`p-2 border rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    adjustmentType === 'add' 
                      ? 'bg-green-600 text-white border-green-600' 
                      : 'hover:bg-green-50 border-gray-300'
                  }`}
                >
                  <FiPlus /> Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('subtract')}
                  className={`p-2 border rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    adjustmentType === 'subtract' 
                      ? 'bg-red-600 text-white border-red-600' 
                      : 'hover:bg-red-50 border-gray-300'
                  }`}
                >
                  <FiMinus /> Remove Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('set')}
                  className={`p-2 border rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    adjustmentType === 'set' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'hover:bg-blue-50 border-gray-300'
                  }`}
                >
                  <FiPackage /> Set Exact
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Quantity *
                {adjustmentType === 'add' && ' (to add)'}
                {adjustmentType === 'subtract' && ' (to remove)'}
                {adjustmentType === 'set' && ' (new quantity)'}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity"
                required
              />
              {newStockValue !== null && newStockValue !== currentStock && (
                <p className="text-sm mt-1">
                  {adjustmentType === 'add' && (
                    <span className="text-green-600">
                      Will change from {currentStock} → {newStockValue} (+{quantity})
                    </span>
                  )}
                  {adjustmentType === 'subtract' && (
                    <span className="text-red-600">
                      Will change from {currentStock} → {newStockValue} (-{quantity})
                    </span>
                  )}
                  {adjustmentType === 'set' && (
                    <span className="text-blue-600">
                      Will change from {currentStock} → {newStockValue}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium mb-2">Reason *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select reason</option>
                <option value="stock_count">Stock Count / Inventory Audit</option>
                <option value="damaged">Damaged Goods</option>
                <option value="expired">Expired Products</option>
                <option value="return">Customer Return</option>
                <option value="correction">Inventory Correction</option>
                <option value="theft">Theft / Loss</option>
                <option value="transfer">Stock Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes about this adjustment..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedProduct}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiSave /> Submit Adjustment
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent Adjustments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Adjustments</h2>
            <button
              onClick={fetchRecentAdjustments}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentAdjustments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent adjustments</p>
            ) : (
              recentAdjustments.map((adj) => (
                <div key={adj.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{adj.product_name || adj.product}</p>
                      <p className="text-sm text-gray-500">{adj.reason}</p>
                      {adj.notes && (
                        <p className="text-xs text-gray-400 mt-1">{adj.notes}</p>
                      )}
                    </div>
                    <div className={`font-bold ${getAdjustmentTypeColor(adj.type)}`}>
                      {getAdjustmentTypeIcon(adj.type)}
                      {adj.type === 'add' ? '+' : adj.type === 'subtract' ? '-' : ''}
                      {adj.quantity}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>
                      {adj.created_at ? new Date(adj.created_at).toLocaleDateString() : adj.date} 
                      {adj.user && ` by ${adj.user.name || adj.user}`}
                    </span>
                    <span>
                      {adj.old_stock} → {adj.new_stock}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <FiAlertCircle className="text-yellow-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-yellow-800">Important Note</p>
          <p className="text-sm text-yellow-700">
            Stock adjustments affect your inventory levels and cannot be easily undone. 
            Please double-check the quantity and reason before submitting.
            {adjustmentType === 'subtract' && ' Ensure you are not removing more than available stock.'}
            {adjustmentType === 'set' && ' This will override the current stock value completely.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustments;