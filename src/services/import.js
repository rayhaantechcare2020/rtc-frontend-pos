import api from './api';

export const importService = {
  async importProducts(formData) {
    try {
      const response = await api.post('/import/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error importing products:', error);
      throw error;
    }
  },

  async downloadTemplate() {
    try {
      // Use fetch directly instead of axios for blob download
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/import/template`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/csv'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }
      
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error downloading template:', error);
      throw error;
    }
  },

  async importCustomers(formData) {
    try {
      const response = await api.post('/import/customers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error importing customers:', error);
      throw error;
    }
  },

  async exportProducts() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/export/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/csv'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export products');
      }
      
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error exporting products:', error);
      throw error;
    }
  }
};