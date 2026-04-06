// services/reportService.js
import api from './api';

export const reportService = {
  // ==================== SALES REPORTS ====================
  
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
   * Get sales range report
   * @param {Object} params - Query parameters (from, to, group_by)
   */
  async getSalesRange(params = {}) {
    try {
      const response = await api.get('/reports/sales-range', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales range:', error);
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
   * Get customer summary
   */
  async getCustomerSummary() {
    try {
      const response = await api.get('/reports/customers');
      return response.data;
    } catch (error) {
      console.error('Error fetching customer summary:', error);
      throw error;
    }
  },

  /**
   * Get inventory summary
   */
  async getInventorySummary() {
    try {
      const response = await api.get('/reports/inventory');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      throw error;
    }
  },

  // ==================== BANK TRANSACTION REPORTS ====================
  
  /**
   * Get bank transaction report with filters
   * @param {Object} params - Filter parameters
   * @param {number} params.bank_id - Filter by bank ID
   * @param {string} params.date_from - Start date (Y-m-d)
   * @param {string} params.date_to - End date (Y-m-d)
   * @param {string} params.transaction_reference - Search by transaction reference
   * @param {number} params.per_page - Items per page (default: 20)
   * @param {number} params.page - Page number (default: 1)
   * @returns {Promise} Bank transaction report data
   */
  async getBankTransactionReport(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.bank_id) queryParams.append('bank_id', params.bank_id);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.transaction_reference) queryParams.append('transaction_reference', params.transaction_reference);
      if (params.per_page) queryParams.append('per_page', params.per_page);
      if (params.page) queryParams.append('page', params.page);
      
      const response = await api.get(`/reports/bank-transactions?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank transaction report:', error);
      throw error;
    }
  },

  /**
   * Get single bank transaction details by ID
   * @param {number} id - Sale ID (transaction ID)
   * @returns {Promise} Transaction details with bank info
   */
  async getBankTransactionDetails(id) {
    try {
      const response = await api.get(`/reports/bank-transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank transaction details:', error);
      throw error;
    }
  },

  /**
   * Export bank transaction report
   * @param {Object} params - Export parameters
   * @param {number} params.bank_id - Filter by bank ID
   * @param {string} params.date_from - Start date (Y-m-d)
   * @param {string} params.date_to - End date (Y-m-d)
   * @param {string} params.format - Export format (csv, excel, pdf)
   * @returns {Promise} Blob response for download
   */
  async exportBankTransactionReport(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.bank_id) queryParams.append('bank_id', params.bank_id);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      queryParams.append('format', params.format || 'csv');
      
      const response = await api.get(`/reports/bank-transactions/export?${queryParams}`, {
        responseType: 'blob'
      });
      
      return response;
    } catch (error) {
      console.error('Error exporting bank transaction report:', error);
      throw error;
    }
  },

  /**
   * Get bank summary (dashboard widget)
   * @param {Object} params - Filter parameters
   * @param {string} params.date_from - Start date (Y-m-d)
   * @param {string} params.date_to - End date (Y-m-d)
   * @returns {Promise} Bank summary data
   */
  async getBankSummary(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      
      const response = await api.get(`/reports/bank-summary?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank summary:', error);
      throw error;
    }
  },

  /**
   * Get bank transaction by reference number
   * @param {string} reference - Transaction reference number
   * @returns {Promise} Transaction details
   */
  async getTransactionByReference(reference) {
    try {
      const response = await api.get(`/reports/bank-transactions/reference/${reference}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction by reference:', error);
      throw error;
    }
  },

  /**
   * Get bank transactions for a specific customer
   * @param {number} customerId - Customer ID
   * @param {Object} params - Filter parameters
   * @param {string} params.date_from - Start date (Y-m-d)
   * @param {string} params.date_to - End date (Y-m-d)
   * @param {number} params.per_page - Items per page
   * @returns {Promise} Customer bank transactions
   */
  async getCustomerBankTransactions(customerId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.per_page) queryParams.append('per_page', params.per_page);
      
      const response = await api.get(`/reports/customers/${customerId}/bank-transactions?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer bank transactions:', error);
      throw error;
    }
  },

  /**
   * Get daily bank transaction summary
   * @param {string} date - Date (Y-m-d)
   * @returns {Promise} Daily summary
   */
  async getDailyBankSummary(date) {
    try {
      const response = await api.get(`/reports/daily-bank-summary?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily bank summary:', error);
      throw error;
    }
  },

  /**
   * Get monthly bank transaction summary
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise} Monthly summary
   */
  async getMonthlyBankSummary(year, month) {
    try {
      const response = await api.get(`/reports/monthly-bank-summary?year=${year}&month=${month}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly bank summary:', error);
      throw error;
    }
  },

  /**
   * Get bank performance report (top banks by transaction volume)
   * @param {Object} params - Filter parameters
   * @param {string} params.date_from - Start date (Y-m-d)
   * @param {string} params.date_to - End date (Y-m-d)
   * @param {number} params.limit - Number of banks to return (default: 10)
   * @returns {Promise} Bank performance data
   */
  async getBankPerformance(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const response = await api.get(`/reports/bank-performance?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank performance:', error);
      throw error;
    }
  },

  /**
   * Verify bank transaction (mark as verified)
   * @param {number} id - Sale ID
   * @param {Object} data - Verification data
   * @param {string} data.verified_by - Name of person verifying
   * @param {string} data.notes - Verification notes
   * @returns {Promise} Verification result
   */
  async verifyBankTransaction(id, data) {
    try {
      const response = await api.post(`/reports/bank-transactions/${id}/verify`, data);
      return response.data;
    } catch (error) {
      console.error('Error verifying bank transaction:', error);
      throw error;
    }
  },

  /**
   * Get pending bank transactions (unverified)
   * @param {Object} params - Filter parameters
   * @param {string} params.date_from - Start date (Y-m-d)
   * @param {string} params.date_to - End date (Y-m-d)
   * @param {number} params.per_page - Items per page
   * @returns {Promise} Pending transactions
   */
  async getPendingBankTransactions(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.per_page) queryParams.append('per_page', params.per_page);
      
      const response = await api.get(`/reports/bank-transactions/pending?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending bank transactions:', error);
      throw error;
    }
  },

  /**
   * Generate bank reconciliation report
   * @param {Object} params - Reconciliation parameters
   * @param {number} params.bank_id - Bank ID
   * @param {string} params.date_from - Start date (Y-m-d)
   * @param {string} params.date_to - End date (Y-m-d)
   * @returns {Promise} Reconciliation report
   */
  async getBankReconciliation(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.bank_id) queryParams.append('bank_id', params.bank_id);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      
      const response = await api.get(`/reports/bank-reconciliation?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank reconciliation:', error);
      throw error;
    }
  },

  /**
   * Download deposit slip for a transaction
   * @param {number} id - Sale ID
   * @returns {Promise} Blob response
   */
  async downloadDepositSlip(id) {
    try {
      const response = await api.get(`/reports/bank-transactions/${id}/deposit-slip`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error downloading deposit slip:', error);
      throw error;
    }
  },

  /**
   * Upload deposit slip for existing transaction
   * @param {number} id - Sale ID
   * @param {File} file - Deposit slip file
   * @returns {Promise} Upload result
   */
  async uploadDepositSlip(id, file) {
    try {
      const formData = new FormData();
      formData.append('deposit_slip', file);
      
      const response = await api.post(`/reports/bank-transactions/${id}/deposit-slip`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading deposit slip:', error);
      throw error;
    }
  },

  /**
   * Get bank transaction statistics by bank
   * @param {Object} params - Filter parameters
   * @param {string} params.date_from - Start date (Y-m-d)
   * @param {string} params.date_to - End date (Y-m-d)
   * @returns {Promise} Bank statistics
   */
  async getBankStatistics(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      
      const response = await api.get(`/reports/bank-statistics?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank statistics:', error);
      throw error;
    }
  },

  /**
   * Get sales report filtered by bank
   * @param {Object} params - Filter parameters
   * @param {number} params.bank_id - Bank ID
   * @param {string} params.date_from - Start date (Y-m-d)
   * @param {string} params.date_to - End date (Y-m-d)
   * @param {string} params.payment_method - Payment method (cash/bank)
   * @returns {Promise} Sales report by bank
   */
  async getSalesByBank(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.bank_id) queryParams.append('bank_id', params.bank_id);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.payment_method) queryParams.append('payment_method', params.payment_method);
      
      const response = await api.get(`/reports/sales-by-bank?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sales by bank:', error);
      throw error;
    }
  },

  /**
   * Get bank transaction dashboard data
   * @param {Object} params - Filter parameters
   * @returns {Promise} Dashboard data
   */
  async getBankDashboard(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      
      const response = await api.get(`/reports/bank-dashboard?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank dashboard:', error);
      throw error;
    }
  },

  /**
   * Get bank transaction trend (daily/weekly/monthly)
   * @param {Object} params - Filter parameters
   * @param {string} params.date_from - Start date (Y-m-d)
   * @param {string} params.date_to - End date (Y-m-d)
   * @param {string} params.interval - Interval (day, week, month)
   * @returns {Promise} Trend data
   */
  async getBankTransactionTrend(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.interval) queryParams.append('interval', params.interval);
      
      const response = await api.get(`/reports/bank-transaction-trend?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank transaction trend:', error);
      throw error;
    }
  },

  /**
   * Get bank transaction by invoice number
   * @param {string} invoiceNumber - Invoice number
   * @returns {Promise} Transaction details
   */
  async getTransactionByInvoice(invoiceNumber) {
    try {
      const response = await api.get(`/reports/bank-transactions/invoice/${invoiceNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction by invoice:', error);
      throw error;
    }
  },

  /**
   * Get bank reconciliation summary
   * @param {Object} params - Filter parameters
   * @param {number} params.bank_id - Bank ID
   * @param {string} params.date - Date for reconciliation (Y-m-d)
   * @returns {Promise} Reconciliation summary
   */
  async getReconciliationSummary(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.bank_id) queryParams.append('bank_id', params.bank_id);
      if (params.date) queryParams.append('date', params.date);
      
      const response = await api.get(`/reports/reconciliation-summary?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reconciliation summary:', error);
      throw error;
    }
  }
};

export default reportService;