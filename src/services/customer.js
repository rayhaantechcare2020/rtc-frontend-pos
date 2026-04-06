import api from './api';

export const customerService = {
    
  //Get customers for POS endpoint
  async getCustomersList(params = {}) {
    try {
      const response = await api.get('/customers-list', { params });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  
  
  // Get customers with optional filters
async getCustomers(params = {}) {
    try {
      const response = await api.get('/customers', { params });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async getCustomer(id) {
    //Get single customer by ID
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  async createCustomer(data) {
    //Create new customer
    const response = await api.post('/customers', data);
    return response.data;
  },

  async updateCustomer(id, data) {
    //Update existing customer
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  async deleteCustomers(id) {
    //Delete customer by ID
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  }
};