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
    // Mock data - replace with actual API call
    setRecentAdjustments([
      { id: 1, product: 'Product A', type: 'add', quantity: 10, old_stock: 45, new_stock: 55, reason: 'Stock count', date: '2024-03-16', user: 'Admin' },
      { id: 2, product: 'Product B', type: 'remove', quantity: 5, old_stock: 30, new_stock: 25, reason: 'Damaged', date: '2024-03-15', user: 'Admin' },
      { id: 3, product: 'Product C', type: 'set', quantity: 20, old_stock: 15, new_stock: 20, reason: 'Correction', date: '2024-03-14', user: 'Admin' },
    ]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    if (!quantity || parseInt(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    try {
      let newQuantity;
      const currentQty = selectedProduct.stock_quantity;

      switch (adjustmentType) {
        case 'add':
          newQuantity = currentQty + parseInt(quantity);
          break;
        case 'remove':
          newQuantity = currentQty - parseInt(quantity);
          if (newQuantity < 0) {
            toast.error('Cannot remove more than current stock');
            return;
          }
          break;
        case 'set':
          newQuantity = parseInt(quantity);
          break;
        default:
          return;
      }

      await productService.updateStock(selectedProduct.id, {
        quantity: newQuantity,
        type: 'set',
        reason: reason,
        notes: notes
      });

      toast.success('Stock adjusted successfully');
      
      // Reset form
      setSelectedProduct(null);
      setQuantity('');
      setReason('');
      setNotes('');
      setSearch('');
      
      // Refresh data
      fetchProducts();
      fetchRecentAdjustments();
      
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    }
  };

  const formatCurrency = (value) => {
    return `₦${Number(value).toLocaleString()}`;
  };

  const getAdjustmentTypeColor = (type) => {
    switch(type) {
      case 'add': return 'text-green-600';
      case 'remove': return 'text-red-600';
      case 'set': return 'text-blue-600';
      default: return 'text-gray-600';
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
                  placeholder="Search products..."
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
                      <span>{product.name}</span>
                      <span className="text-sm text-gray-500">Stock: {product.stock_quantity}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedProduct && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-600">Current Stock: {selectedProduct.stock_quantity}</p>
                  <p className="text-sm text-gray-600">SKU: {selectedProduct.sku || 'N/A'}</p>
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
                  className={`p-2 border rounded-lg flex items-center justify-center gap-2 ${
                    adjustmentType === 'add' ? 'bg-green-600 text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  <FiPlus /> Add
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('remove')}
                  className={`p-2 border rounded-lg flex items-center justify-center gap-2 ${
                    adjustmentType === 'remove' ? 'bg-red-600 text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  <FiMinus /> Remove
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('set')}
                  className={`p-2 border rounded-lg flex items-center justify-center gap-2 ${
                    adjustmentType === 'set' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  <FiPackage /> Set
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Quantity *
                {adjustmentType === 'add' && ' (to add)'}
                {adjustmentType === 'remove' && ' (to remove)'}
                {adjustmentType === 'set' && ' (new quantity)'}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity"
                required
              />
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
                <option value="stock_count">Stock Count</option>
                <option value="damaged">Damaged Goods</option>
                <option value="expired">Expired</option>
                <option value="return">Customer Return</option>
                <option value="correction">Correction</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
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
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <FiSave /> Submit Adjustment
            </button>
          </form>
        </div>

        {/* Recent Adjustments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Adjustments</h2>
            <button
              onClick={fetchRecentAdjustments}
              className="text-blue-600 hover:text-blue-800"
            >
              <FiRefreshCw />
            </button>
          </div>

          <div className="space-y-4">
            {recentAdjustments.map((adj) => (
              <div key={adj.id} className="border-b pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{adj.product}</p>
                    <p className="text-sm text-gray-500">{adj.reason}</p>
                  </div>
                  <span className={`font-bold ${getAdjustmentTypeColor(adj.type)}`}>
                    {adj.type === 'add' ? '+' : adj.type === 'remove' ? '-' : ''}{adj.quantity}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{adj.date} by {adj.user}</span>
                  <span>{adj.old_stock} → {adj.new_stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <FiAlertCircle className="text-yellow-600 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-800">Important Note</p>
          <p className="text-sm text-yellow-700">
            Stock adjustments affect your inventory levels and cannot be undone. 
            Please double-check the quantity and reason before submitting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustments;