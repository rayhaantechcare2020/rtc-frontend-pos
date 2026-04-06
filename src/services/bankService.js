import api from './api';

export const bankService = {
  /**
   * Get all banks
   * @returns {Promise} List of banks
   */
  async getBanks() {
    try {
      const response = await api.get('/banks');
      return response.data;
    } catch (error) {
      console.error('Error fetching banks:', error);
      throw error;
    }
  },

  /**
   * Get active banks only
   * @returns {Promise} List of active banks
   */
  async getActiveBanks() {
    try {
      const response = await api.get('/banks?active=1');
      return response.data;
    } catch (error) {
      console.error('Error fetching active banks:', error);
      throw error;
    }
  },

  /**
   * Get bank by ID
   * @param {number} id - Bank ID
   * @returns {Promise} Bank details
   */
  async getBank(id) {
    try {
      const response = await api.get(`/banks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank:', error);
      throw error;
    }
  },

  /**
   * Create new bank
   * @param {Object} bankData - Bank data
   * @returns {Promise} Created bank
   */
  async createBank(bankData) {
    try {
      const response = await api.post('/banks', bankData);
      return response.data;
    } catch (error) {
      console.error('Error creating bank:', error);
      throw error;
    }
  },

  /**
   * Update bank
   * @param {number} id - Bank ID
   * @param {Object} bankData - Updated bank data
   * @returns {Promise} Updated bank
   */
  async updateBank(id, bankData) {
    try {
      const response = await api.put(`/banks/${id}`, bankData);
      return response.data;
    } catch (error) {
      console.error('Error updating bank:', error);
      throw error;
    }
  },

  /**
   * Delete bank
   * @param {number} id - Bank ID
   * @returns {Promise} Deletion result
   */
  async deleteBank(id) {
    try {
      const response = await api.delete(`/banks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting bank:', error);
      throw error;
    }
  }
};

export default bankService;