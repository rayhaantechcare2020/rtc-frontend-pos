import React, { useState, useEffect } from 'react';
import { FiCalendar, FiSearch, FiDownload, FiEye, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { format } from 'date-fns';
import { reportService } from '../../services/reportService';
import { bankService } from '../../services/bankService';
import toast from 'react-hot-toast';

const BankTransactionReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
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
        per_page: pagination.per_page,
        page: pagination.current_page
      });
      
      setTransactions(response.data.data || []);
      setSummary(response.summary || {});
      setBankBreakdown(response.bank_breakdown || []);
      setPagination({
        current_page: response.data.current_page || 1,
        last_page: response.data.last_page || 1,
        per_page: response.data.per_page || 20,
        total: response.data.total || 0
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load bank transactions');
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount) => {
    return `₦${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bank Transaction Report</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold">{summary.total_transactions || 0}</p>
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
          <p className="text-2xl font-bold">{summary.unique_customers || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Banks Used</p>
          <p className="text-2xl font-bold">{summary.total_banks_used || 0}</p>
        </div>
      </div>

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
            <FiDownload size={14} /> Export CSV
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
            No bank transactions found
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{formatDate(transaction.created_at)}</td>
                      <td className="px-6 py-4 text-sm font-mono">{transaction.invoice_number}</td>
                      <td className="px-6 py-4 text-sm">{transaction.customer_name || 'Walk-in Customer'}</td>
                      <td className="px-6 py-4 text-sm">
                        {transaction.bank?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {transaction.transaction_reference || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                        {formatCurrency(transaction.amount)}
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
                    onClick={() => setPagination({...pagination, current_page: pagination.current_page - 1})}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {pagination.current_page} of {pagination.last_page}
                  </span>
                  <button
                    onClick={() => setPagination({...pagination, current_page: pagination.current_page + 1})}
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
    </div>
  );
};

export default BankTransactionReport;