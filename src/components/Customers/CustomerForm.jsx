import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX, FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard } from 'react-icons/fi';
import { customerService } from '../../services/customer';
import toast from 'react-hot-toast';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_number: '',
    credit_limit: '',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    if (id) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setFetching(true);
      const response = await customerService.getCustomer(id);
      
      let customerData = null;
      if (response?.data) {
        if (response.data.data) {
          customerData = response.data.data;
        } else {
          customerData = response.data;
        }
      }
      
      if (customerData) {
        setFormData({
          name: customerData.name || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          address: customerData.address || '',
          tax_number: customerData.tax_number || '',
          credit_limit: customerData.credit_limit || '',
          notes: customerData.notes || '',
          status: customerData.status || 'active'
        });
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer');
      navigate('/customers');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null
      };

      if (id) {
        await customerService.updateCustomer(id, submitData);
        toast.success('Customer updated successfully');
      } else {
        await customerService.createCustomer(submitData);
        toast.success('Customer created successfully');
      }
      navigate('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          toast.error(`${key}: ${errors[key][0]}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to save customer');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (fetching) {
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
        <h1 className="text-2xl font-bold">
          {id ? 'Edit Customer' : 'Add New Customer'}
        </h1>
        <button
          onClick={() => navigate('/customers')}
          className="text-gray-600 hover:text-gray-800"
        >
          <FiX size={24} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Name */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium mb-2">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter customer name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="customer@example.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-3 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="08012345678"
              />
            </div>
          </div>

          {/* Tax Number */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium mb-2">Tax/VAT Number</label>
            <div className="relative">
              <FiCreditCard className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="tax_number"
                value={formData.tax_number}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="TAX-12345"
              />
            </div>
          </div>

          {/* Credit Limit */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium mb-2">Credit Limit (₦)</label>
            <input
              type="number"
              name="credit_limit"
              value={formData.credit_limit}
              onChange={handleChange}
              min="0"
              step="1000"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no credit limit</p>
          </div>

          {/* Status */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Address</label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-3 text-gray-400" />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Customer address"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about this customer..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FiSave /> {loading ? 'Saving...' : (id ? 'Update Customer' : 'Save Customer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;