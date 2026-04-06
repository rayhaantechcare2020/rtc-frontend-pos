import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX } from 'react-icons/fi';
import { vendorService } from '../../services/vendors';
import toast from 'react-hot-toast';

const VendorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_number: '',
    payment_terms: 'Net 30',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    if (id) {
      fetchVendor();
    }
  }, [id]);

  const fetchVendor = async () => {
    try {
      setFetching(true);
      const response = await vendorService.getVendor(id);
      
      let vendorData = null;
      if (response?.data) {
        if (response.data.data) {
          vendorData = response.data.data;
        } else {
          vendorData = response.data;
        }
      }
      
      if (vendorData) {
        setFormData({
          name: vendorData.name || '',
          contact_person: vendorData.contact_person || '',
          email: vendorData.email || '',
          phone: vendorData.phone || '',
          address: vendorData.address || '',
          tax_number: vendorData.tax_number || '',
          payment_terms: vendorData.payment_terms || 'Net 30',
          notes: vendorData.notes || '',
          status: vendorData.status || 'active'
        });
      }
    } catch (error) {
      console.error('Error fetching vendor:', error);
      toast.error('Failed to load vendor');
      navigate('/vendors');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name.trim()) {
      toast.error('Vendor name is required');
      setLoading(false);
      return;
    }

    try {
      if (id) {
        await vendorService.updateVendor(id, formData);
        toast.success('Vendor updated successfully');
      } else {
        await vendorService.createVendor(formData);
        toast.success('Vendor created successfully');
      }
      navigate('/vendors');
    } catch (error) {
      console.error('Error saving vendor:', error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          toast.error(`${key}: ${errors[key][0]}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to save vendor');
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Vendor</h1>
        <button
          onClick={() => navigate('/vendors')}
          className="text-gray-600 hover:text-gray-800"
        >
          <FiX size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter vendor name"
            />
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium mb-2">Contact Person</label>
            <input
              type="text"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contact person name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="vendor@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="08012345678"
            />
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Vendor address"
            />
          </div>

          {/* Tax Number */}
          <div>
            <label className="block text-sm font-medium mb-2">Tax Number</label>
            <input
              type="text"
              name="tax_number"
              value={formData.tax_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VAT/Tax ID"
            />
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Terms</label>
            <select
              name="payment_terms"
              value={formData.payment_terms}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
              <option value="Due on receipt">Due on receipt</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about this vendor"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={() => navigate('/vendors')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FiSave /> {loading ? 'Saving...' : (id ? 'Update Vendor' : 'Save Vendor')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorForm;