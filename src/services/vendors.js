import api from './api';

export const vendorService = {
  // Get all vendors
  async getVendors(params = {}) {
    try {
      const response = await api.get('/vendors', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  // Get single vendor
  async getVendor(id) {
    const response = await api.get(`/vendors/${id}`);
    return response.data;
  },

  // Create new vendor
  async createVendor(data) {
    const response = await api.post('/vendors', data);
    return response.data;
  },

  // Update vendor
  async updateVendor(id, data) {
    const response = await api.put(`/vendors/${id}`, data);
    return response.data;
  },

  // Delete vendor
  async deleteVendor(id) {
    const response = await api.delete(`/vendors/${id}`);
    return response.data;
  },

  // Toggle vendor status
  async toggleStatus(id) {
    const response = await api.patch(`/vendors/${id}/toggle-status`);
    return response.data;
  },

  // Get vendors for dropdown (simplified list)
  async getVendorsList() {
    const response = await api.get('/vendors-list');
    return response.data;
  }
};