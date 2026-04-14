import React, { useState, useEffect } from 'react';
import { FiCalendar, FiSearch, FiDownload, FiEye, FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi';
import { format } from 'date-fns';
import { reportService } from '../../services/reportService';
import { bankService } from '../../services/bankService';
import toast from 'react-hot-toast';

const BankTransactionReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState({
    bank_id: '',
    date_from: '',
    date_to: '',
    transaction_reference: '',
    payment_type: '' // Add payment type filter
  });
  const [summary, setSummary] = useState({
    total_transactions: 0,
    total_amount: 0,
    average_transaction: 0,
    unique_customers: 0,
    total_banks_used: 0,
    total_sale_payments: 0,
    total_credit_payments: 0,
    sale_payments_amount: 0,
    credit_payments_amount: 0
  });
  const [bankBreakdown, setBankBreakdown] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchBanks();
    fetchTransactions();
  }, [filters, pagination.current_page]);

  const fetchBanks = async () => {
    try {
      const response = await bankService.getActiveBanks();
      setBanks(response.data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await reportService.getBankTransactionReport({
        bank_id: filters.bank_id || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        transaction_reference: filters.transaction_reference || undefined,
        payment_type: filters.payment_type || undefined,
        per_page: pagination.per_page,
        page: pagination.current_page
      });
      
      // Handle the response correctly
      const transactionsData = response.transactions || response.data?.data || [];
      
      // Process transactions to ensure customer name is displayed properly
      const processedTransactions = transactionsData.map(transaction => ({
        ...transaction,
        // Priority order for customer name display
        display_customer_name: 
          transaction.customer_name || 
          transaction.customer?.name || 
          (transaction.payment_type === 'Credit Payment' ? 'Bank Transfer Customer' : 'Walk-in Customer'),
        // For credit payments without customer, show reference as identifier
        display_reference: transaction.transaction_reference || transaction.reference || 'N/A'
      }));
      
      setTransactions(processedTransactions);
      setSummary(response.summary || {});
      setBankBreakdown(response.bank_breakdown || []);
      setPagination({
        current_page: response.data?.current_page || response.current_page || 1,
        last_page: response.data?.last_page || response.last_page || 1,
        per_page: response.data?.per_page || response.per_page || 20,
        total: response.data?.total || response.total || 0
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load bank transactions');
    } finally {
      setLoading(false);
    }
  };

  // Manual sync with bank
  const handleSyncWithBank = async () => {
    try {
      setSyncing(true);
      toast.loading('Syncing with bank...', { id: 'sync' });
      
      const response = await bankService.syncBankTransactions({
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined
      });
      
      toast.success(`Synced ${response.synced_count || 0} new transactions`, { id: 'sync' });
      
      // Refresh the transaction list
      await fetchTransactions();
    } catch (error) {
      console.error('Error syncing with bank:', error);
      toast.error('Failed to sync with bank', { id: 'sync' });
    } finally {
      setSyncing(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, current_page: 1 });
  };

  const handleExport = async (format) => {
    try {
      const response = await reportService.exportBankTransactionReport({
        bank_id: filters.bank_id || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        payment_type: filters.payment_type || undefined,
        format: format
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bank_transactions_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const formatCurrency = (amount) => {
    return `N${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  return (
    <div className="p-6">
      {/* Header with Sync Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bank Transaction Report</h1>
        <button
          onClick={handleSyncWithBank}
          disabled={syncing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          <FiRefreshCw className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync with Bank'}
        </button>
      </div>

      {/* Updated Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold">{summary.total_transactions || 0}</p>
          <div className="flex gap-2 mt-1 text-xs">
            <span className="text-blue-600">Sales: {summary.total_sale_payments || 0}</span>
            <span className="text-purple-600">Credit: {summary.total_credit_payments || 0}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_amount)}</p>
          <div className="flex gap-2 mt-1 text-xs">
            <span className="text-blue-600">Sales: {formatCurrency(summary.sale_payments_amount)}</span>
            <span className="text-purple-600">Credit: {formatCurrency(summary.credit_payments_amount)}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Average Transaction</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.average_transaction)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Unique Customers</p>
          <p className="text-2xl font-bold">{summary.unique_customers || 0}</p>
        </div>
      </div>

      {/* Filters with Payment Type */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bank</label>
            <select
              value={filters.bank_id}
              onChange={(e) => handleFilterChange('bank_id', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Banks</option>
              {banks.map(bank => (
                <option key={bank.id} value={bank.id}>{bank.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Type</label>
            <select
              value={filters.payment_type}
              onChange={(e) => handleFilterChange('payment_type', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Payments</option>
              <option value="sale">Sale Payments (POS/Cash)</option>
              <option value="credit">Credit Payments (Bank Transfer)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transaction Reference</label>
            <input
              type="text"
              value={filters.transaction_reference}
              onChange={(e) => handleFilterChange('transaction_reference', e.target.value)}
              placeholder="Search by reference..."
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-1 border rounded hover:bg-gray-50 text-sm flex items-center gap-1"
          >
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Bank Breakdown Section */}
      {bankBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <h2 className="text-lg font-semibold mb-3">Bank Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankBreakdown.map((bank, index) => (
              <div key={index} className="border rounded-lg p-3">
                <p className="font-medium">{bank.bank_name}</p>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Transactions: {bank.count}</span>
                  <span className="text-blue-600">Sales: {bank.sale_count || 0}</span>
                  <span className="text-purple-600">Credit: {bank.credit_count || 0}</span>
                </div>
                <p className="text-sm text-green-600 font-semibold mt-1">Total: {formatCurrency(bank.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No bank transactions found
            <button
              onClick={handleSyncWithBank}
              className="ml-2 text-blue-600 hover:underline"
            >
              Try syncing with bank
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice/Ref</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Ref</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{formatDate(transaction.created_at || transaction.transaction_date)}</td>
                      <td className="px-6 py-4 text-sm">
                        {transaction.payment_type === 'Credit Payment' || transaction.payment_type === 'credit_payment' ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            Credit Payment
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Sale Payment
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        {transaction.invoice_number || transaction.reference || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {transaction.display_customer_name || transaction.customer_name || transaction.customer?.name || 'Unknown Customer'}
                          </span>
                          {(!transaction.customer_name && !transaction.customer?.name && transaction.payment_type === 'Credit Payment') && (
                            <span className="text-xs text-gray-400">Unmatched Transfer</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{transaction.bank?.name || transaction.bank_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-mono">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {transaction.transaction_reference || transaction.reference || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewDetails(transaction)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="6" className="px-6 py-3 text-right font-medium">Total:</td>
                    <td className="px-6 py-3 text-right font-bold text-green-600">
                      {formatCurrency(transactions.reduce((sum, t) => sum + (t.amount || 0), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} transactions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({...pagination, current_page: pagination.current_page - 1})}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {pagination.current_page} of {pagination.last_page}
                  </span>
                  <button
                    onClick={() => setPagination({...pagination, current_page: pagination.current_page + 1})}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Transaction Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiChevronDown size={24} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="border-b pb-2">
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">{formatDate(selectedTransaction.created_at || selectedTransaction.transaction_date)}</p>
              </div>
              
              <div className="border-b pb-2">
                <p className="text-sm text-gray-500">Payment Type</p>
                <p className="font-medium">{selectedTransaction.payment_type || 'N/A'}</p>
              </div>
              
              <div className="border-b pb-2">
                <p className="text-sm text-gray-500">Customer Name</p>
                <p className="font-medium">{selectedTransaction.display_customer_name || selectedTransaction.customer_name || selectedTransaction.customer?.name || 'Unknown Customer'}</p>
              </div>
              
              {selectedTransaction.customer?.email && (
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">Customer Email</p>
                  <p className="font-medium">{selectedTransaction.customer.email}</p>
                </div>
              )}
              
              <div className="border-b pb-2">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(selectedTransaction.amount)}</p>
              </div>
              
              <div className="border-b pb-2">
                <p className="text-sm text-gray-500">Bank</p>
                <p className="font-medium">{selectedTransaction.bank?.name || selectedTransaction.bank_name || 'N/A'}</p>
              </div>
              
              <div className="border-b pb-2">
                <p className="text-sm text-gray-500">Transaction Reference</p>
                <p className="font-mono text-sm bg-gray-100 p-1 rounded">{selectedTransaction.transaction_reference || selectedTransaction.reference || 'N/A'}</p>
              </div>
              
              {selectedTransaction.invoice_number && (
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-medium">{selectedTransaction.invoice_number}</p>
                </div>
              )}
              
              {selectedTransaction.sale && (
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">Sale Details</p>
                  <p className="font-medium">Invoice: {selectedTransaction.sale.invoice_number}</p>
                  <p className="text-sm">Total: {formatCurrency(selectedTransaction.sale.total)}</p>
                </div>
              )}
              
              {selectedTransaction.notes && (
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankTransactionReport;