import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, 
  FiShoppingBag, 
  FiUsers, 
  FiPrinter,
  FiDownload,
  FiCheck,
  FiX,
  FiCalendar,
  FiUser
} from 'react-icons/fi';
import { saleService } from '../../services/sale';
import { companyService } from '../../services/company';
import toast from 'react-hot-toast';

const EndOfDay = () => {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState({
    summary: {
      date: '',
      total_transactions: 0,
      total_revenue: 0,
      total_profit: 0,
      total_items_sold: 0,
      average_sale: 0,
      by_payment_method: {
        cash: 0,
        transfer: 0,
        pos: 0,
        credit: 0
      }
    },
    transactions: []
  });
  const [isClosed, setIsClosed] = useState(false);
  const [closingData, setClosingData] = useState(null);

  useEffect(() => {
    fetchDailyReport();
  }, [date]);

 // In fetchDailyReport function, fix the data extraction
const fetchDailyReport = async () => {
  try {
    setLoading(true);
    const response = await saleService.getDailySales(date);
    //console.log('Daily Sales API Response:', response);
    
    if (response.success) {
      // Extract data correctly from response
      const summaryData = response.data?.summary || {};
      const transactionsData = response.data?.transactions || [];
      
      setReport({
        summary: {
          date: summaryData.date || date,
          total_transactions: summaryData.total_transactions || 0,
          total_revenue: summaryData.total_revenue || 0,
          total_profit: summaryData.total_profit || 0,
          total_items_sold: summaryData.total_items_sold || 0,
          average_sale: summaryData.average_sale || 0,
          by_payment_method: {
            cash: summaryData.by_payment_method?.cash || 0,
            transfer: summaryData.by_payment_method?.transfer || 0,
            pos: summaryData.by_payment_method?.pos || 0,
            credit: summaryData.by_payment_method?.credit || 0
          }
        },
        transactions: transactionsData
      });
    }
  } catch (error) {
    console.error('Error fetching daily report:', error);
    toast.error('Failed to load daily report');
  } finally {
    setLoading(false);
  }
};


// In EndOfDay.jsx, modify handleCloseDay
const handleCloseDay = async () => {
  const dateToClose = date;
  console.log('Attempting to close date:', dateToClose);
  
  if (!window.confirm(`Are you sure you want to close the day for ${dateToClose}?`)) {
    return;
  }

  try {
    const response = await saleService.closeDay(dateToClose);
    console.log('Close day response:', response);
    // ... rest of code
    if (response.success) {
        setIsClosed(true);
       setClosingData(response.data);
       toast.success('Day closed successfully!');
     }
  } catch (error) {
    console.error('Close day error details:', error.response?.data);
    toast.error(error.response?.data?.message || 'Failed to close day');
  }
};
  

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>End of Day Report - ${date}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: flex; justify-content: space-around; margin: 30px 0; }
            .card { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; min-width: 150px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .text-right { text-align: right; }
            .footer { margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>End of Day Report</h1>
            <h3>${report?.summary?.date || date}</h3>
          </div>
          
          <div class="summary">
            <div class="card">
              <h3>Total Sales</h3>
              <p>${report?.summary?.total_transactions || 0}</p>
            </div>
            <div class="card">
              <h3>Total Revenue</h3>
              <p>₦${(report?.summary?.total_revenue || 0).toLocaleString()}</p>
            </div>
            <div class="card">
              <h3>Total Items Sold</h3>
              <p>${report?.summary?.total_items_sold || 0}</p>
            </div>
          </div>
          
          <h3>Payment Breakdown</h3>
          <table>
            <thead><tr><th>Payment Method</th><th class="text-right">Amount</th></tr></thead>
            <tbody>
              <tr><td>Cash</td><td class="text-right">₦${(report?.summary?.by_payment_method?.cash || 0).toLocaleString()}</td></tr>
              <tr><td>Transfer</td><td class="text-right">₦${(report?.summary?.by_payment_method?.transfer || 0).toLocaleString()}</td></tr>
              <tr><td>POS</td><td class="text-right">₦${(report?.summary?.by_payment_method?.pos || 0).toLocaleString()}</td></tr>
              <tr><td>Credit</td><td class="text-right">₦${(report?.summary?.by_payment_method?.credit || 0).toLocaleString()}</td></tr>
            </tbody>
          </table>
          
          <h3>Transactions</h3>
          <table>
            <thead><tr><th>Time</th><th>Invoice</th><th>Cashier</th><th>Customer</th><th class="text-right">Amount</th></tr></thead>
            <tbody>
              ${report?.transactions?.map(t => `
                <tr>
                  <td>${t.time || '-'}</td>
                  <td>${t.invoice || '-'}</td>
                  <td>${t.cashier || 'System'}</td>
                  <td>${t.customer || 'Walk-in'}</td>
                  <td class="text-right">₦${(t.total || 0).toLocaleString()}</td>
                </tr>
              `).join('') || '<tr><td colspan="5">No transactions</td></tr>'}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This report is system generated and is considered final.</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '₦0';
    }
    return `₦${Number(value).toLocaleString()}`;
  };

  // Safe accessors
  const summary = report?.summary || {};
  const paymentMethods = summary?.by_payment_method || {};
  const transactions = report?.transactions || [];

  if (loading) {
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
        <h1 className="text-2xl font-bold">End of Day Report</h1>
        <div className="flex gap-2">
          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPrinter /> Print Report
          </button>
          <button
            onClick={fetchDailyReport}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <FiCalendar className="text-gray-500" />
          <label className="font-medium">Select Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Status Banner */}
      {isClosed ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiCheck className="text-green-600 text-2xl" />
            <div>
              <h3 className="font-semibold text-green-800">Day Closed</h3>
              <p className="text-sm text-green-600">This day has been closed. No further sales can be added.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Closed by: {closingData?.closed_by || 'System'}</p>
            <p className="text-xs text-gray-400">Closed at: {new Date(closingData?.closed_at).toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiX className="text-yellow-600 text-2xl" />
            <div>
              <h3 className="font-semibold text-yellow-800">Day Open</h3>
              <p className="text-sm text-yellow-600">Sales can still be added. Close day to finalize.</p>
            </div>
          </div>
          <button
            onClick={handleCloseDay}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Close Day
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold">{summary.total_transactions || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_revenue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Items Sold</p>
          <p className="text-2xl font-bold text-blue-600">{summary.total_items_sold || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Average Sale</p>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.average_sale)}</p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Cash</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(paymentMethods.cash)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Transfer</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(paymentMethods.transfer)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">POS</p>
          <p className="text-xl font-bold text-purple-600">{formatCurrency(paymentMethods.pos)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Credit</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(paymentMethods.credit)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-6 border-b">Transactions</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No transactions for this date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">{transaction.time || '-'}</td>
                    <td className="px-6 py-4 font-mono text-sm">{transaction.invoice || '-'}</td>
                    <td className="px-6 py-4">{transaction.customer || 'Walk-in'}</td>
                    <td className="px-6 py-4 text-right">{transaction.items || 0}</td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(transaction.total)}</td>
                    <td className="px-6 py-4 capitalize">{transaction.payment || 'cash'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndOfDay;