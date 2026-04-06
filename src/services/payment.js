import api from './api';

export const paymentService = {
  /**
   * Get all payments for a customer
   * @param {number} customerId - Customer ID
   */
  async getCustomerPayments(customerId) {
    try {
      const response = await api.get(`/customers/${customerId}/payments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer payments:', error);
      throw error;
    }
  },

  /**
   * Create a new payment
   * @param {Object} paymentData - Payment data
   */
async createPayment(paymentData) {
  try {
    console.log('Sending payment data:', paymentData);
    
    const response = await api.post('/payments', {
      customer_id: paymentData.customer_id,
      amount: paymentData.amount,
      method: paymentData.method,
      reference: paymentData.reference || '',
      date: paymentData.date,        // This will be mapped to payment_date in controller
      sale_id: paymentData.sale_id || null,
      notes: paymentData.notes || ''
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating payment:', error.response?.data || error);
    throw error;
  }
},

  /**
   * Get a single payment by ID
   * @param {number} id - Payment ID
   */
  async getPayment(id) {
    try {
      const response = await api.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  /**
   * Update a payment
   * @param {number} id - Payment ID
   * @param {Object} paymentData - Updated payment data
   */
  async updatePayment(id, paymentData) {
    try {
      const response = await api.put(`/payments/${id}`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  /**
   * Delete a payment
   * @param {number} id - Payment ID
   */
  async deletePayment(id) {
    try {
      const response = await api.delete(`/payments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },

  /**
   * Get payment summary for a date range
   * @param {string} from - Start date
   * @param {string} to - End date
   */
  async getPaymentSummary(from, to) {
    try {
      const response = await api.get('/payments/summary', { params: { from, to } });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      throw error;
    }
  },

  /**
   * Get all payments (with optional filters)
   * @param {Object} params - Query parameters
   */
  async getAllPayments(params = {}) {
    try {
      const response = await api.get('/payments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  /**
   * Process a bulk payment
   * @param {Array} payments - Array of payment data
   */
  async processBulkPayment(payments) {
    try {
      const response = await api.post('/payments/bulk', { payments });
      return response.data;
    } catch (error) {
      console.error('Error processing bulk payment:', error);
      throw error;
    }
  },

  /**
   * Get outstanding payments
   */
  async getOutstandingPayments() {
    try {
      const response = await api.get('/payments/outstanding');
      return response.data;
    } catch (error) {
      console.error('Error fetching outstanding payments:', error);
      throw error;
    }
  },

  /**
   * Get payment methods statistics
   */
  async getPaymentMethodsStats() {
    try {
      const response = await api.get('/payments/methods-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods stats:', error);
      throw error;
    }
  },

  /**
   * Reverse a payment (if needed)
   * @param {number} id - Payment ID
   * @param {string} reason - Reason for reversal
   */
  async reversePayment(id, reason) {
    try {
      const response = await api.post(`/payments/${id}/reverse`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error reversing payment:', error);
      throw error;
    }
  }
};