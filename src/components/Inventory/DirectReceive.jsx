import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { directReceiveService } from '../../services/directReceive';
import { productService } from '../../services/products';
import { vendorService } from '../../services/vendors';
import toast from 'react-hot-toast';

const DirectReceive = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([
    { product_id: '', quantity: 1, unit_cost: 0 }
  ]);
  const [formData, setFormData] = useState({
    receive_date: new Date().toISOString().split('T')[0],
    vendor_id: '',
    vendor_name: '',
    vendor_phone: '',
    waybill_number: '',
    truck_number: '',
    driver_name: '',
    driver_phone: '',
    notes: '',
    payment_status: 'pending',
    payment_method: 'cash'
  });

  useEffect(() => {
    fetchProducts();
    fetchVendors();
  }, []);

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
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getVendors({ per_page: 100 });
      let vendorsData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          vendorsData = response.data;
        } else if (response.data.data) {
          vendorsData = response.data.data;
        }
      }
      setVendors(vendorsData);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    
    if (field === 'quantity' || field === 'unit_cost') {
      // Convert to number, handle empty string
      const numValue = value === '' ? '' : Number(value);
      updatedItems[index][field] = numValue;
    } else {
      updatedItems[index][field] = value;
    }
    
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_cost: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.unit_cost) || 0;
      return sum + (qty * cost);
    }, 0);
  };

  const validateForm = () => {
    // Check if at least one item has product and quantity
    const validItems = items.filter(item => 
      item.product_id && 
      Number(item.quantity) > 0 && 
      Number(item.unit_cost) >= 0
    );
    
    if (validItems.length === 0) {
      toast.error('Add at least one valid item');
      return false;
    }

    // Check if either vendor_id or vendor_name is provided
    if (!formData.vendor_id && !formData.vendor_name.trim()) {
      toast.error('Please select a vendor or enter vendor name');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Filter out invalid items
      const validItems = items
        .filter(item => item.product_id && Number(item.quantity) > 0)
        .map(item => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_cost: Number(item.unit_cost) || 0
        }));

      const submitData = {
        receive_date: formData.receive_date,
        vendor_id: formData.vendor_id ? Number(formData.vendor_id) : null,
        vendor_name: formData.vendor_name || null,
        vendor_phone: formData.vendor_phone || null,
        waybill_number: formData.waybill_number || null,
        truck_number: formData.truck_number || null,
        driver_name: formData.driver_name || null,
        driver_phone: formData.driver_phone || null,
        payment_status: formData.payment_status,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        items: validItems
      };

      console.log('Submitting direct receive:', submitData);

      const response = await directReceiveService.create(submitData);
      
      if (response.success) {
        toast.success('Items received successfully');
        navigate('/direct-receive/history');
      }
    } catch (error) {
      console.error('Error saving direct receive:', error);
      
      // Show validation errors from API
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          toast.error(`${key}: ${errors[key][0]}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to save direct receive');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Direct Receive</h1>
        <button
          onClick={() => navigate('/inventory/stock')}
          className="text-gray-600 hover:text-gray-800"
        >
          <FiX size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Receive Date *</label>
            <input
              type="date"
              name="receive_date"
              value={formData.receive_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Vendor</label>
            <select
              name="vendor_id"
              value={formData.vendor_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Vendor</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">RETYPE VENDOR NAME *</label>
            <input
              type="text"
              name="vendor_name"
              value={formData.vendor_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="RETYPE VENDOR NAME"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Vendor Phone</label>
            <input
              type="text"
              name="vendor_phone"
              value={formData.vendor_phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Tracking Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Waybill Number</label>
            <input
              type="text"
              name="waybill_number"
              value={formData.waybill_number}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Truck Number</label>
            <input
              type="text"
              name="truck_number"
              value={formData.truck_number}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Driver Name</label>
            <input
              type="text"
              name="driver_name"
              value={formData.driver_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Driver Phone</label>
            <input
              type="text"
              name="driver_phone"
              value={formData.driver_phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Items Received</h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <FiPlus /> Add Item
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end">
              <div className="col-span-5">
                <label className="block text-sm font-medium mb-2">Product</label>
                <select
                  value={item.product_id}
                  onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="1"
                  step="1"
                  required
                />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-2">Unit Cost (₦)</label>
                <input
                  type="number"
                  value={item.unit_cost}
                  onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="col-span-2">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-right">
            <span className="text-lg font-bold">
              Total: ₦{calculateTotal().toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Payment Status</label>
            <select
              name="payment_status"
              value={formData.payment_status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="pos">POS</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/inventory/stock')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiSave /> {loading ? 'Saving...' : 'Receive Items'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DirectReceive;