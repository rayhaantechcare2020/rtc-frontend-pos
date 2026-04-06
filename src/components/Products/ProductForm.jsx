import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX } from 'react-icons/fi';
import { productService } from '../../services/products';
import {categoryService} from '../../services/category';
import toast from 'react-hot-toast';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    cost: '',
    stock_quantity: '',
    category_id: '',
    description: '',
    status: 'active'
  });

  // Fetch categories for dropdown
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch product data if editing
  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setFetching(true);
      const response = await productService.getProduct(id);
      console.log('Product data:', response);
      
      // Handle response structure
      let productData = null;
      if (response?.data) {
        if (response.data.data) {
          productData = response.data.data;
        } else {
          productData = response.data;
        }
      }
      
      if (productData) {
        setFormData({
          name: productData.name || '',
          sku: productData.sku || '',
          price: productData.price || '',
          cost: productData.cost || '',
          stock_quantity: productData.stock_quantity || '',
          category_id: productData.category_id || '',
          description: productData.description || '',
          status: productData.status || 'active'
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.name || !formData.price) {
      toast.error('Name and price are required');
      setLoading(false);
      return;
    }

    try {
      let response;
      
      // Convert string numbers to actual numbers
      const submitData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      };

      if (id) {
        // Update existing product
        response = await productService.updateProduct(id, submitData);
        toast.success('Product updated successfully');
      } else {
        // Create new product
        response = await productService.createProduct(submitData);
        toast.success('Product created successfully');
      }

      //console.log('Save response:', response);
      navigate('/products');
      
    } catch (error) {
      console.error('Error saving product:', error);
      
      // Handle validation errors from Laravel
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          toast.error(`${key}: ${errors[key][0]}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to save product');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        <h1 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Product</h1>
        <button
          onClick={() => navigate('/products')}
          className="text-gray-600 hover:text-gray-800"
        >
          <FiX size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Product name"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium mb-2">SKU</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SKU-001"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Price (₦) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium mb-2">Cost (₦)</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium mb-2">Stock Quantity</label>
            <input
              type="number"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              placeholder="0"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
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

          {/* Description - full width */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Product description..."
            ></textarea>
          </div>
        </div>

        {/* Profit margin hint */}
        {formData.price && formData.cost && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm">
              Profit Margin: {' '}
              <span className="font-semibold text-green-600">
                ₦{(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}
              </span>
              {' '}(
              {((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price) * 100).toFixed(1)}%
              )
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition"
          >
            <FiSave /> {loading ? 'Saving...' : (id ? 'Update Product' : 'Save Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;