import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiSearch, 
  FiDownload, 
  FiPrinter,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiInfo
} from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import BankTransactionDetails from './BankTransactionDetails';

const BankTransactionReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    bank_id: '',
    date_from: '',
    date_to: '',
    transaction_reference: ''
  });
  const [summary, setSummary] = useState({
    total_transactions: 0,
    total_amount: 0,
    average_transaction: 0,
    unique_customers: 0,
    total_banks_used: 0
  });
  const [bankBreakdown, setBankBreakdown] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });
  const [showBankBreakdown, setShowBankBreakdown] = useState(true);

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters, pagination.current_page]);

  const fetchBanks = async () => {
    try {
      const response = await api.get('/banks');
      setBanks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.bank_id) params.append('bank_id', filters.bank_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.transaction_reference) params.append('transaction_reference', filters.transaction_reference);
      params.append('per_page', pagination.per_page);
      params.append('page', pagination.current_page);

      const response = await api.get(`/reports/bank-transactions?${params}`);
      
      setTransactions(response.data.data.data);
      setSummary(response.data.summary);
      setBankBreakdown(response.data.bank_breakdown);
      setPagination({
        current_page: response.data.data.current_page,
        last_page: response.data.data.last_page,
        per_page: response.data.data.per_page,
        total: response.data.data.total
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, current_page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, current_page: newPage });
  };

  const handleViewDetails = async (transaction) => {
    try {
      const response = await api.get(`/reports/bank-transactions/${transaction.id}`);
      setSelectedTransaction(response.data.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast.error('Failed to load transaction details');
    }
  };

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams();
      if (filters.bank_id) params.append('bank_id', filters.bank_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      params.append('format', format);

      const response = await api.get(`/reports/bank-transactions/export?${params}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bank_transactions_${format}_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return `₦${Number(amount).toLocaleString()}`;
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bank Transaction Report</h1>
        <p className="text-gray-600">View and filter all bank transfer transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold">{summary.total_transactions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_amount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Average Transaction</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.average_transaction)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Unique Customers</p>
          <p className="text-2xl font-bold">{summary.unique_customers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Banks Used</p>
          <p className="text-2xl font-bold">{summary.total_banks_used}</p>
        </div>
      </div>

      {/* Bank Breakdown */}
      {bankBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <button
            onClick={() => setShowBankBreakdown(!showBankBreakdown)}
            className="w-full px-6 py-3 flex justify-between items-center hover:bg-gray-50"
          >
            <h3 className="font-semibold">Bank Breakdown</h3>
            {showBankBreakdown ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {showBankBreakdown && (
            <div className="p-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankBreakdown.map((bank) => (
                  <div key={bank.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{bank.name}</h4>
                      <span className="text-sm text-gray-500">{bank.percentage}%</span>
                    </div>
                    <p className="text-sm text-gray-600">Account: {bank.account_name}</p>
                    <p className="text-sm text-gray-600">Number: {bank.account_number}</p>
                    <div className="mt-2 pt-2 border-t flex justify-between">
                      <span className="text-sm">Transactions:</span>
                      <span className="font-semibold">{bank.transaction_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Amount:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(bank.total_amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <FiDownload size={14} /> CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-1 border rounded hover:bg-gray-50 text-sm flex items-center gap-1"
          >
            <FiDownload size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No Bank Transaction found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Ref</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{formatDate(transaction.created_at)}</td>
                      <td className="px-6 py-4 text-sm font-mono">{transaction.invoice_number}</td>
                      <td className="px-6 py-4 text-sm">
                        {transaction.customer_name || transaction.customer?.name || 'Walk-in Customer'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium">{transaction.bank?.name}</p>
                          <p className="text-xs text-gray-500">{transaction.bank?.account_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {transaction.transaction_reference}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                        {formatCurrency(transaction.total)}
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
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {pagination.current_page} of {pagination.last_page}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-3 py-1 border rounded disabled:opacity-50"
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
      {showDetails && selectedTransaction && (
        <BankTransactionDetails
          transaction={selectedTransaction}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

export default BankTransactionReport;