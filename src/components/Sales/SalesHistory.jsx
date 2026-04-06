import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiEye, 
  FiPrinter, 
  FiDownload, 
  FiCalendar, 
  FiSearch,
  FiRefreshCw,
  FiX
} from 'react-icons/fi';
import { saleService } from '../../services/sale';
import { companyService } from '../../services/company';
import toast from 'react-hot-toast';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState('invoice');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15
  });
  const [printerSettings, setPrinterSettings] = useState({
    default_printer_type: 'thermal',
    print_copies: 1
  });
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchPrinterSettings();
  }, [pagination.current_page]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current_page,
        per_page: pagination.per_page,
        from_date: dateRange.from || undefined,
        to_date: dateRange.to || undefined,
      };
      
      if (search) {
        if (searchType === 'invoice') {
          params.search = search;
        } else if (searchType === 'amount') {
          params.search_amount = parseFloat(search);
        }
      }
      
      const response = await saleService.getSales(params);
      
      if (response.success) {
        setSales(response.data.data || []);
        setPagination({
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          total: response.data.total || 0,
          per_page: response.data.per_page || 15
        });
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrinterSettings = async () => {
    try {
      const response = await companyService.getPrinterSettings();
      if (response.success) {
        setPrinterSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching printer settings:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchSales();
  };

  const handleClearSearch = () => {
    setSearch('');
    setSearchType('invoice');
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchSales();
  };

  const handleDateFilter = () => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchSales();
  };

  const printReceipt = async (saleId, type = null) => {
    try {
      setPrinting(true);
      
      const receiptType = type || printerSettings.default_printer_type;
      const copies = printerSettings.print_copies || 1;
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('You must be logged in');
        return;
      }
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      toast.loading('Preparing receipt...', { id: `print-${saleId}` });
      
      // For thermal receipts, we need to display in a popup
      if (receiptType === 'thermal') {
        const url = `${baseUrl}/pos/receipt/${saleId}/print?type=thermal&action=display&autoprint=true&token=${encodeURIComponent(token)}`;
        
        // Open in new window with specific dimensions for thermal receipt
        const printWindow = window.open(url, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
        
        if (!printWindow) {
          toast.error('Please allow popups to print receipts', { id: `print-${saleId}` });
        } else {
          toast.success('Receipt opened for printing', { id: `print-${saleId}` });
        }
      } 
      // For A4/PDF receipts, download or open in new tab
      else {
        const url = `${baseUrl}/api/pos/receipt/${saleId}/print?type=${receiptType}&action=display&token=${encodeURIComponent(token)}`;
        
        // Open in new tab for PDF
        const printWindow = window.open(url, '_blank');
        
        if (!printWindow) {
          toast.error('Please allow popups to print receipts', { id: `print-${saleId}` });
        } else {
          toast.success('Receipt opened', { id: `print-${saleId}` });
        }
      }
      
      // For multiple copies
      if (copies > 1 && receiptType === 'thermal') {
        toast.info(`Opening ${copies} copies of receipt`, { id: `print-${saleId}` });
      }
      
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast.error('Failed to print receipt', { id: `print-${saleId}` });
    } finally {
      setPrinting(false);
    }
  };

  const downloadReceipt = async (saleId) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${baseUrl}/api/pos/receipt/${saleId}/print?type=pdf&action=download&token=${encodeURIComponent(token)}`;
      
      // Open in new tab for download
      window.open(url, '_blank');
      toast.success('Receipt opened for download');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  const formatCurrency = (value) => {
    return `₦${Number(value).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      voided: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && sales.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales History</h1>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="flex gap-2">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="invoice">Invoice Number</option>
                <option value="amount">Total Amount</option>
              </select>
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={searchType === 'amount' ? 'number' : 'text'}
                  placeholder={searchType === 'invoice' ? "Search by invoice number..." : "Enter exact amount (e.g., 5000)"}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Search
              </button>
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-1"
                >
                  <FiX size={16} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Date From */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-3 text-gray-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="From date"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-3 text-gray-400" />
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="To date"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleDateFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {sales.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No sales found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-mono text-sm">{sale.invoice_number}</td>
                      <td className="px-6 py-4">
                        {new Date(sale.sale_date).toLocaleDateString()}<br />
                        <span className="text-xs text-gray-500">{sale.sale_time}</span>
                      </td>
                      <td className="px-6 py-4">
                        {sale.customer?.name || 'Walk-in Customer'}
                        {sale.customer?.phone && (
                          <div className="text-xs text-gray-500">{sale.customer.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">{sale.item_count}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="capitalize">{sale.payments?.[0]?.payment_method || 'cash'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(sale.status)}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => printReceipt(sale.id, 'thermal')}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          title="Print Thermal Receipt"
                          disabled={printing}
                        >
                          <FiPrinter />
                        </button>
                        <button
                          onClick={() => printReceipt(sale.id, 'a4')}
                          className="text-green-600 hover:text-green-800 mr-2"
                          title="Print A4 Receipt"
                          disabled={printing}
                        >
                          <FiDownload />
                        </button>
                        <Link
                          to={`/sales/${sale.id}`}
                          className="text-purple-600 hover:text-purple-800"
                          title="View Details"
                        >
                          <FiEye />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                    disabled={pagination.current_page === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
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

export default SalesHistory;