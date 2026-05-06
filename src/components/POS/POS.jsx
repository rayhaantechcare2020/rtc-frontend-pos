import React, { useState, useEffect, lazy, Suspense } from 'react';
import { FiSearch, FiShoppingCart, FiPlus, FiMinus, FiX, FiClock } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart, updateQuantity, clearCart } from '../../store/cartSlice';
import { productService } from '../../services/products';
import { saleService } from '../../services/sale';
import { holdSaleService } from '../../services/holdSaleService';
import { categoryService } from '../../services/category';
import toast from 'react-hot-toast';

// Lazy load checkout and holdsales modal components
const Checkout = lazy(() => import('./Checkout'));
const HoldSalesModal = lazy(() => import('../holdSalesModal'));

const POS = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [notes, setNotes] = useState('');
  const [showHoldSales, setShowHoldSales] = useState(false);
  const [holdingSale, setHoldingSale] = useState(false);
  const [heldSalesCount, setHeldSalesCount] = useState(0);
  const [quantityInputs, setQuantityInputs] = useState({});
  
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  // Fetch held sales count on mount
  useEffect(() => {
    fetchHeldSalesCount();
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!products.length) return;
    
    let filtered = [...products];
    
    if (search) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category_id === parseInt(selectedCategory));
    }
    
    setFilteredProducts(filtered);
  }, [search, selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      
      let productsData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          productsData = response.data.data;
        }
      }
      
      const activeProducts = productsData.filter(p => 
        p.status === 'active' && p.stock_quantity > 0
      );
      
      setProducts(activeProducts);
      setFilteredProducts(activeProducts);
      
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      console.log('Categories response:', response);
      
      let categoriesData = [];
      if (response?.success) {
        if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data?.data) {
          categoriesData = response.data.data;
        }
      }
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchHeldSalesCount = async () => {
    try {
      const response = await holdSaleService.getHeldSales();
      if (response.success) {
        setHeldSalesCount(response.data.length);
      }
    } catch (error) {
      console.error('Error fetching held sales count:', error);
    }
  };

  const handleHoldSale = async () => {
    if (!cart.items || cart.items.length === 0) {
      toast.error('Cart is empty. Nothing to hold.');
      return;
    }

    setHoldingSale(true);
    
    try {
      const cartData = {
        cart_items: {
          items: cart.items.map(item => ({
            product_id: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            stock: item.stock
          })),
          subtotal: cart.subtotal || 0,
          discount: cart.discount || 0,
          total: cart.total || 0
        },
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || 'Walk-in Customer',
        customer_phone: selectedCustomer?.phone || '',
        notes: notes || '',
        expires_in_hours: 24
      };
      
      const response = await holdSaleService.holdSale(cartData);
      
      if (response.success) {
        toast.success(`Sale held successfully! Reference: ${response.data.hold_reference}`);
        dispatch(clearCart());
        setSelectedCustomer(null);
        setNotes('');
        fetchHeldSalesCount();
      }
    } catch (error) {
      console.error('Error holding sale:', error);
      toast.error(error.response?.data?.message || 'Failed to hold sale');
    } finally {
      setHoldingSale(false);
    }
  };

  const handleRestoreHeldSale = (restoredData) => {
    if (restoredData.cart && restoredData.cart.items) {
      restoredData.cart.items.forEach(item => {
        dispatch(addToCart({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          stock: item.stock
        }));
      });
    }
    
    if (restoredData.customer) {
      setSelectedCustomer(restoredData.customer);
    }
    
    if (restoredData.notes) {
      setNotes(restoredData.notes);
    }
    
    toast.success('Sale restored! You can continue checkout.');
    fetchHeldSalesCount();
  };

  const handleAddToCart = (product) => {
    if (product.stock_quantity <= 0) {
      toast.error('Out of stock');
      return;
    }
    
    dispatch(addToCart({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      stock: product.stock_quantity
    }));
    toast.success('Added to cart');
  };

  // Handle quantity input change - update local state
  const handleQuantityInputChange = (productId, inputValue) => {
    // Allow empty string for typing
    setQuantityInputs(prev => ({
      ...prev,
      [productId]: inputValue === '' ? '' : inputValue
    }));
  };

  // Apply the quantity when input is committed
  const handleQuantityCommit = (productId) => {
    const item = cart.items?.find(i => Number(i.product_id) === Number(productId));
    if (!item) return;
    
    let inputValue = quantityInputs[productId];
    
    // If input is empty or undefined, use current quantity
    if (inputValue === '' || inputValue === undefined) {
      setQuantityInputs(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      return;
    }
    
    let newQuantity = parseInt(inputValue);
    
    // Validate input
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    }
    
    // Check stock limit
    if (newQuantity > item.stock) {
      newQuantity = item.stock;
      toast.error(`Maximum stock available: ${item.stock}`);
    }
    
    // Only update if quantity changed
    if (newQuantity !== item.quantity) {
      dispatch(updateQuantity({ 
        productId: Number(productId), 
        quantity: newQuantity 
      }));
    }
    
    // Clear the input state for this product to show Redux value
    setQuantityInputs(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  const handleIncrement = (productId) => {
    const item = cart.items?.find(i => Number(i.product_id) === Number(productId));
    if (!item) return;
    
    if (item.quantity >= item.stock) {
      toast.error('Maximum stock reached');
      return;
    }
    
    const newQuantity = item.quantity + 1;
    dispatch(updateQuantity({ 
      productId: Number(productId), 
      quantity: newQuantity 
    }));
    
    // Clear any pending input for this product
    setQuantityInputs(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  const handleDecrement = (productId) => {
    const item = cart.items?.find(i => Number(i.product_id) === Number(productId));
    if (!item) return;
    
    if (item.quantity <= 1) {
      dispatch(removeFromCart(Number(productId)));
      toast.success('Item removed');
    } else {
      const newQuantity = item.quantity - 1;
      dispatch(updateQuantity({ 
        productId: Number(productId), 
        quantity: newQuantity 
      }));
    }
    
    // Clear any pending input for this product
    setQuantityInputs(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(Number(productId)));
    toast.success('Item removed');
    
    // Clear input state for this product
    setQuantityInputs(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  // Format currency safely
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₦0';
    }
    return `₦${Number(amount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Safely get cart values
  const cartItems = cart?.items || [];
  const cartSubtotal = cart?.subtotal || 0;
  const cartDiscount = cart?.discount || 0;
  const cartTotal = cart?.total || 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Point of Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
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
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No products available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-125 overflow-y-auto p-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                      product.stock_quantity <= 0 ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-blue-500'
                    }`}
                  >
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(product.price)}</p>
                    <p className="text-sm text-gray-500">Stock: {product.stock_quantity}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sticky top-20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiShoppingCart /> Cart ({cartItems.length})
            </h2>
            
            <button
              onClick={() => setShowHoldSales(true)}
              className="relative bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition flex items-center gap-2 mb-4 w-full justify-center"
            >
              <FiClock className="text-sm" />
              Held Sales
              {heldSalesCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {heldSalesCount}
                </span>
              )}
            </button>
            
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Cart is empty
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-96 overflow-auto mb-4">
                  {cartItems.map((item) => {
                    // Determine what to show in the quantity input
                    // If we have a pending input for this product, show that, otherwise show the Redux quantity
                    const displayValue = quantityInputs[item.product_id] !== undefined 
                      ? quantityInputs[item.product_id] 
                      : item.quantity;
                    
                    return (
                      <div key={item.product_id} className="border-b pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium">{item.name || 'Unknown Product'}</h3>
                            <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.product_id)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border rounded">
                            {/* Minus Button */}
                            <button
                              onClick={() => handleDecrement(item.product_id)}
                              className="px-2 py-1 hover:bg-gray-100 transition-colors"
                              type="button"
                            >
                              <FiMinus size={16} />
                            </button>
                            
                            {/* Quantity Input */}
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={displayValue}
                              onChange={(e) => {
                                // Allow only numbers
                                const value = e.target.value;
                                if (value === '' || /^\d+$/.test(value)) {
                                  handleQuantityInputChange(item.product_id, value);
                                }
                              }}
                              onBlur={() => handleQuantityCommit(item.product_id)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleQuantityCommit(item.product_id);
                                }
                              }}
                              className="w-16 px-2 py-1 text-center border-x focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ 
                                MozAppearance: 'textfield',
                                appearance: 'textfield'
                              }}
                            />
                            
                            {/* Plus Button */}
                            <button
                              onClick={() => handleIncrement(item.product_id)}
                              className="px-2 py-1 hover:bg-gray-100 transition-colors"
                              disabled={item.quantity >= (item.stock || 999)}
                              type="button"
                            >
                              <FiPlus size={16} />
                            </button>
                          </div>
                          
                          <span className="font-semibold">
                            {formatCurrency((Number(item.price) || 0) * (item.quantity || 0))}
                          </span>
                        </div>
                        
                        {item.quantity >= (item.stock || 999) && (
                          <p className="text-xs text-red-500 mt-1">Max stock reached</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  {cartDiscount > 0 && (
                    <div className="flex justify-between mb-2 text-red-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(cartDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between mb-4 text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(cartTotal)}</span>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Checkout ({formatCurrency(cartTotal)})
                  </button>
                  
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleHoldSale}
                      disabled={holdingSale || cartItems.length === 0}
                      className="flex-1 bg-yellow-600 text-white py-2 rounded-lg font-semibold hover:bg-yellow-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {holdingSale ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <>
                          <FiClock className="text-sm" /> Hold Sale
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => dispatch(clearCart())}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showCheckout && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <Checkout
            cart={cart}
            onClose={() => setShowCheckout(false)}
            onComplete={(saleData) => {
              dispatch(clearCart());
              setShowCheckout(false);
              setSelectedCustomer(null);
              setNotes('');
              toast.success('Sale completed!');
              fetchHeldSalesCount();
            }}
          />
        </Suspense>
      )}

      {showHoldSales && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <HoldSalesModal
            onClose={() => setShowHoldSales(false)}
            onRestore={handleRestoreHeldSale}
          />
        </Suspense>
      )}
    </div>
  );
};

export default POS;