import api from './api';

export const saleService = {

  // checkout: async (saleData) => {
  //   try {
  //     console.log('📤 Sending checkout data:', JSON.stringify(saleData, null, 2));
  //     const response = await api.post('/sales', saleData);
  //     console.log('✅ Checkout response:', response.data);
  //     return response.data;
  //   } catch (error) {
  //     console.error('❌ Checkout error:', error);
  //     if (error.response?.status === 422) {
  //       console.error('Validation errors:', error.response.data?.errors);
  //     }
  //     throw error;
  //   }
  // },

  async getSales(params = {}) {
  try {
    const response = await api.get('/sales', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
},

  /**
   * Get today's sales summary
   */
  async getTodaySummary() {
    try {
      const response = await api.get('/pos/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today\'s summary:', error);
      throw error;
    }
  },

  /**
   * Process a checkout sale
   * @param {Object} saleData - The sale data
   */
  async checkout(saleData) {
    try {
      const response = await api.post('/pos/checkout', saleData);
      return response.data;
    } catch (error) {
      console.error('Error processing checkout:', error);
      throw error;
    }
  },

  /**
   * Process a quick sale (minimal input)
   * @param {Object} quickSaleData - Quick sale data
   */
  async quickSale(quickSaleData) {
    try {
      const response = await api.post('/pos/quick-sale', quickSaleData);
      return response.data;
    } catch (error) {
      console.error('Error processing quick sale:', error);
      throw error;
    }
  },

  /**
   * Get sales history with optional filters
   * @param {Object} params - Query parameters (from_date, to_date, customer_id, per_page)
   */
  async getSales(params = {}) {
    try {
      const response = await api.get('/sales', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  },

  /**
   * Get single sale details by ID
   * @param {number|string} id - Sale ID
   */
  async getSaleDetails(id) {
    try {
      const response = await api.get(`/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sale ${id}:`, error);
      throw error;
    }
  },

  /**
   * Void a sale
   * @param {number|string} id - Sale ID to void
   */
  async voidSale(id) {
    try {
      const response = await api.post(`/sales/${id}/void`);
      return response.data;
    } catch (error) {
      console.error(`Error voiding sale ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get sales summary for a date range
   * @param {string} from - Start date (Y-m-d)
   * @param {string} to - End date (Y-m-d)
   */
  async getSummary(from, to) {
    try {
      const response = await api.get('/pos/summary', { params: { from, to } });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      throw error;
    }
  },

  /**
   * Print receipt for a sale
   * @param {number|string} id - Sale ID
   * @param {string} type - Receipt type (thermal, html, pdf)
   */
  async printReceipt(id, type = 'thermal') {
    try {
      const response = await api.get(`/pos/receipt/${id}/print`, { 
        params: { type },
        responseType: type === 'pdf' ? 'blob' : 'text'
      });
      return response.data;
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  },

  /**
   * Email receipt to customer
   * @param {number|string} id - Sale ID
   * @param {string} email - Customer email
   */
  async emailReceipt(id, email) {
    try {
      const response = await api.post(`/pos/receipt/${id}/email`, { email });
      return response.data;
    } catch (error) {
      console.error('Error emailing receipt:', error);
      throw error;
    }
  },

  /**
   * Get top selling products
   * @param {Object} params - Query parameters (limit, from, to)
   */
  async getTopProducts(params = {}) {
    try {
      const response = await api.get('/reports/top-products', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  },

  /**
   * Get daily sales report
   * @param {string} date - Date (Y-m-d)
   */
  async getDailySales(date = null) {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/reports/daily-sales', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching daily sales:', error);
      throw error;
    }
  },

  /**
   * Get profit & loss report
   * @param {string} from - Start date
   * @param {string} to - End date
   */
  async getProfitLoss(from, to) {
    try {
      const response = await api.get('/reports/profit-loss', { params: { from, to } });
      return response.data;
    } catch (error) {
      console.error('Error fetching profit & loss:', error);
      throw error;
    }
  },

  
  /**
   * Close the day - mark all sales as finalized
   * @param {string} date - Date to close (Y-m-d)
   */
  async closeDay(date) {
    try {
      const response = await api.post('/pos/close-day', { date });
      return response.data;
    } catch (error) {
      console.error('Error closing day:', error);
      throw error;
    }
  },

  /**
   * Check if a day is already closed
   * @param {string} date - Date to check (Y-m-d)
   */
  async isDayClosed(date) {
    try {
      const response = await api.get(`/pos/day-status?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error checking day status:', error);
      throw error;
    }
  },

  /**
   * Get closed days report
   * @param {string} from - Start date
   * @param {string} to - End date
   */
  async getClosedDays(from, to) {
    try {
      const response = await api.get('/pos/closed-days', { params: { from, to } });
      return response.data;
    } catch (error) {
      console.error('Error fetching closed days:', error);
      throw error;
    }
  }

  
};