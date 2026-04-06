import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiPrinter, 
  FiDownload, 
  FiTrash2,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiPackage,
  FiAlertCircle
} from 'react-icons/fi';
import { saleService } from '../../services/sale';
import { companyService } from '../../services/company';
import { exportToExcel, formatDailySalesData } from '../../utils/excelExport';
import toast from 'react-hot-toast';


const SalesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [voiding, setVoiding] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [sale, setSale] = useState(null);
  const [printerSettings, setPrinterSettings] = useState({
    default_printer_type: 'thermal',
    print_copies: 1
  });

  useEffect(() => {
    fetchSaleDetails();
    fetchPrinterSettings();
  }, [id]);

  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      const response = await saleService.getSaleDetails(id);
      
      if (response.success) {
        setSale(response.data);
      }
    } catch (error) {
      console.error('Error fetching sale details:', error);
      toast.error('Failed to load sale details');
      navigate('/sales');
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

  const reprintReceipt = async (type = null) => {
    try {
      setPrinting(true);
      
      const receiptType = type || printerSettings.default_printer_type;
      const copies = printerSettings.print_copies || 1;
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('You must be logged in');
        return;
      }
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      toast.loading('Preparing receipt...', { id: 'print-receipt' });
      
      for (let i = 0; i < copies; i++) {
        setTimeout(() => {
          const url = `${baseUrl}/pos/receipt/${id}/print?type=${receiptType}&action=display&autoprint=true&token=${encodeURIComponent(token)}`;
          
          const printWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
          
          if (!printWindow) {
            toast.error('Please allow popups to print receipts', { id: 'print-receipt' });
          } else {
            toast.success('Receipt opened for printing', { id: 'print-receipt' });
          }
        }, i * 500);
      }
    } catch (error) {
      console.error('Error reprinting receipt:', error);
      toast.error('Failed to reprint receipt', { id: 'print-receipt' });
    } finally {
      setPrinting(false);
    }
  };

  const handleVoidSale = async () => {
    if (!window.confirm('Are you sure you want to void this sale? This action cannot be undone.')) {
      return;
    }
    
    try {
      setVoiding(true);
      const response = await saleService.voidSale(id);
      
      if (response.success) {
        toast.success('Sale voided successfully');
        fetchSaleDetails(); // Refresh the data
      }
    } catch (error) {
      console.error('Error voiding sale:', error);
      toast.error(error.response?.data?.message || 'Failed to void sale');
    } finally {
      setVoiding(false);
    }
  };

  const formatCurrency = (value) => {
    return `N${Number(value).toLocaleString()}`;
  };

  //Export to Excel
  const handleExportExcel = () => {
  const { summaryData, transactionData } = formatDailySalesData(
    reportData.summary, 
    reportData.transactions, 
    formatCurrency
  );
  
  // Export summary as one sheet
  const success1 = exportToExcel(summaryData, 'daily_sales_summary', 'Summary');
  
  // Export transactions as another sheet
  const success2 = exportToExcel(transactionData, 'daily_sales_transactions', 'Transactions');
  
  if (success1 && success2) {
    toast.success('Daily sales exported successfully');
  }
};
  const formatDateTime = (date, time) => {
    if (!date) return 'N/A';
    return new Date(`${date}T${time || '00:00:00'}`).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      voided: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Sale not found</p>
        <Link to="/sales" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Sales
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/sales"
            className="text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold">Sale Details</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(sale.status)}`}>
            {sale.status}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => reprintReceipt('thermal')}
            disabled={printing || sale.status === 'voided'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            title="Print Thermal Receipt"
          >
            <FiPrinter /> Thermal
          </button>
          <button
            onClick={() => reprintReceipt('a4')}
            disabled={printing || sale.status === 'voided'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            title="Print A4 Receipt"
          >
            <FiDownload /> A4
          </button>
          {sale.status === 'completed' && (
            <button
              onClick={handleVoidSale}
              disabled={voiding}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
            >
              <FiTrash2 /> {voiding ? 'Voiding...' : 'Void Sale'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Sale Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiPackage /> Items
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sale.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.product_name}</div>
                        {item.product_sku && (
                          <div className="text-xs text-gray-500">SKU: {item.product_sku}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right">Subtotal:</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(sale.subtotal)}</td>
                  </tr>
                  {sale.discount > 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right">Discount:</td>
                      <td className="px-4 py-3 text-right text-green-600">-{formatCurrency(sale.discount)}</td>
                    </tr>
                  )}
                  <tr className="text-lg font-bold">
                    <td colSpan="3" className="px-4 py-3 text-right">Total:</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(sale.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiCreditCard /> Payments
            </h2>
            
            <div className="space-y-3">
              {sale.payments?.map((payment, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiDollarSign className="text-gray-500" />
                    <div>
                      <p className="font-medium capitalize">{payment.payment_method}</p>
                      <p className="text-sm text-gray-500">{payment.reference || 'No reference'}</p>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Amount Paid</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(sale.amount_paid)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Change Due</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(sale.change_due)}</p>
              </div>
              {sale.balance_due > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Balance Due</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(sale.balance_due)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Details */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiUser /> Customer
            </h2>
            
            {sale.customer ? (
              <div className="space-y-3">
                <p className="font-medium text-lg">{sale.customer.name}</p>
                {sale.customer.phone && (
                  <p className="text-gray-600">📞 {sale.customer.phone}</p>
                )}
                {sale.customer.email && (
                  <p className="text-gray-600">✉️ {sale.customer.email}</p>
                )}
                {sale.customer.address && (
                  <p className="text-gray-600">📍 {sale.customer.address}</p>
                )}
                {sale.customer.current_balance > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-700">Customer Balance</p>
                    <p className="text-lg font-bold text-yellow-600">{formatCurrency(sale.customer.current_balance)}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Walk-in Customer</p>
            )}
          </div>

          {/* Sale Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiCalendar /> Transaction Details
            </h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Invoice Number</p>
                <p className="font-mono font-medium">{sale.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p>{formatDateTime(sale.sale_date, sale.sale_time)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cashier</p>
                <p>{sale.user?.name || 'System'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className="capitalize">{sale.payment_status}</p>
              </div>
              {sale.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p>{sale.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Void Warning */}
          {sale.status === 'voided' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-600">
                <FiAlertCircle />
                <p className="font-medium">This sale has been voided</p>
              </div>
              <p className="text-sm text-red-500 mt-1">
                Voided transactions cannot be modified or reprinted
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesDetail;