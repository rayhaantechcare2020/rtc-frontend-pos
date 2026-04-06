import api from './api';

export const directReceiveService = {
  // Get all direct receives
  async getAll(params = {}) {
    const response = await api.get('/direct-receives', { params });
    return response.data;
  },

  // Get single direct receive
  async getById(id) {
    const response = await api.get(`/direct-receives/${id}`);
    return response.data;
  },

  // Create new direct receive
  async create(data) {
    const response = await api.post('/direct-receives', data);
    return response.data;
  },

  // Quick receive (simplified)
  async quickReceive(data) {
    const response = await api.post('/direct-receives/quick', data);
    return response.data;
  },

  // Update payment status
  async updatePayment(id, data) {
    const response = await api.patch(`/direct-receives/${id}/payment`, data);
    return response.data;
  }
};