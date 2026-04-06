import api from './api';

export const companyService = {
  /**
   * Get company details
   * @returns {Promise} Company data
   */
  async getCompany() {
    try {
      const response = await api.get('/company');
      return response.data;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  },

  /**
   * Update company information
   * @param {Object} companyData - Company data to update
   * @returns {Promise} Updated company data
   */
  async updateCompany(companyData) {
    try {
      const response = await api.put('/company', companyData);
      return response.data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  },

  /**
   * Upload company logo
   * @param {FormData} formData - Form data with logo file
   * @returns {Promise} Upload result with logo URL
   */
  async uploadLogo(formData) {
    try {
      const response = await api.post('/company/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  },

  /**
   * Get company settings
   * @returns {Promise} Company settings
   */
  async getSettings() {
    try {
      const response = await api.get('/company/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  /**
   * Update company settings
   * @param {Object} settings - Settings object
   * @returns {Promise} Updated settings
   */
  async updateSettings(settings) {
    try {
      const response = await api.put('/company/settings', { settings });
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  /**
   * Get printer settings
   * @returns {Promise} Printer configuration
   */
  async getPrinterSettings() {
    try {
      const response = await api.get('/company/printer-settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching printer settings:', error);
      throw error;
    }
  },

  /**
   * Update printer settings
   * @param {Object} printerSettings - Printer configuration
   * @returns {Promise} Updated printer settings
   */
  async updatePrinterSettings(printerSettings) {
    try {
      const response = await api.put('/company/printer-settings', printerSettings);
      return response.data;
    } catch (error) {
      console.error('Error updating printer settings:', error);
      throw error;
    }
  },

  /**
   * Get company statistics
   * @returns {Promise} Company stats (products, customers, sales, etc.)
   */
  async getStats() {
    try {
      const response = await api.get('/company/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw error;
    }
  },

  /**
   * Update tax information
   * @param {Object} taxData - Tax information
   * @returns {Promise} Updated tax info
   */
  async updateTaxInfo(taxData) {
    try {
      const response = await api.put('/company/tax', taxData);
      return response.data;
    } catch (error) {
      console.error('Error updating tax info:', error);
      throw error;
    }
  },

  /**
   * Update currency settings
   * @param {Object} currencyData - Currency settings
   * @returns {Promise} Updated currency settings
   */
  async updateCurrency(currencyData) {
    try {
      const response = await api.put('/company/currency', currencyData);
      return response.data;
    } catch (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
  },

  /**
   * Update business hours
   * @param {Object} hoursData - Business hours
   * @returns {Promise} Updated business hours
   */
  async updateBusinessHours(hoursData) {
    try {
      const response = await api.put('/company/hours', hoursData);
      return response.data;
    } catch (error) {
      console.error('Error updating business hours:', error);
      throw error;
    }
  },

  /**
   * Get company users
   * @returns {Promise} List of company users
   */
  async getUsers() {
    try {
      const response = await api.get('/company/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching company users:', error);
      throw error;
    }
  },

  /**
   * Invite new user to company
   * @param {Object} userData - User invitation data
   * @returns {Promise} Invitation result
   */
  async inviteUser(userData) {
    try {
      const response = await api.post('/company/users/invite', userData);
      return response.data;
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  },

  /**
   * Update user role
   * @param {number} userId - User ID
   * @param {string} role - New role
   * @returns {Promise} Updated user
   */
  async updateUserRole(userId, role) {
    try {
      const response = await api.patch(`/company/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  /**
   * Remove user from company
   * @param {number} userId - User ID to remove
   * @returns {Promise} Removal result
   */
  async removeUser(userId) {
    try {
      const response = await api.delete(`/company/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  },

  /**
   * Get audit logs
   * @param {Object} params - Query parameters (date range, user, etc.)
   * @returns {Promise} Audit logs
   */
  async getAuditLogs(params = {}) {
    try {
      const response = await api.get('/company/audit-logs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  /**
   * Export company data
   * @param {string} type - Export type (csv, excel, pdf)
   * @returns {Promise} Exported file
   */
  async exportData(type = 'csv') {
    try {
      const response = await api.get(`/company/export/${type}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  /**
   * Delete company (danger zone)
   * @param {string} confirmation - Confirmation text
   * @returns {Promise} Deletion result
   */
  async deleteCompany(confirmation) {
    try {
      const response = await api.delete('/company', {
        data: { confirmation }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }
};