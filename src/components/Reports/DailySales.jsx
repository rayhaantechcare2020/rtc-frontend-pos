import React, { useState, useEffect } from 'react';
import { FiCalendar, FiDownload, FiDollarSign, FiShoppingBag, FiCreditCard, FiTrendingUp } from 'react-icons/fi';
import { saleService } from '../../services/sale';
import { reportService } from '../../services/reportService';
import { exportToExcel, formatDailySalesData } from '../../utils/excelExport';
import toast from 'react-hot-toast';

const DailySales = () => {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState({
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

  useEffect(() => {
    fetchDailySales();
  }, [selectedDate]);

  const fetchDailySales = async () => {
    try {
      setLoading(true);

      const [reportResp, saleResp] = await Promise.all([
        reportService.getDailySales(selectedDate),
        saleService.getSales({ from_date: selectedDate, to_date: selectedDate, per_page: 100 })
      ]);

      const summaryData = reportResp?.success ? reportResp.data : reportData.summary;
      let transactions = [];

      if (saleResp?.success && Array.isArray(saleResp.data?.data)) {
        transactions = saleResp.data.data.map((sale) => ({
          time: sale.sale_time || new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          invoice: sale.invoice_number || sale.invoice || '-',
          customer: sale.customer?.name || 'Walk-in',
          items: sale.item_count || (sale.items?.length ?? 0),
          total: sale.total ?? 0,
          payment: sale.payment_status || sale.payments?.[0]?.payment_method || 'unknown'
        }));
      }

      setReportData({
        summary: {
          ...reportData.summary,
          ...summaryData
        },
        transactions
      });

    } catch (error) {
      console.error('Error fetching daily sales:', error);
      toast.error('Failed to load daily sales');
    } finally {
      setLoading(false);
    }
  };

  //Export daily sales to XLS
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

  const formatCurrency = (value) => {
    if(value === null || value === undefined || value === ''){
      return '₦0';
    }
    const num = Number(value);

    //Check if its a valid number
    if(isNaN(num)){
      return '₦0';
    }

    return `₦${num.toLocaleString()}`;
    //return `₦${Number(value).toLocaleString()}`;
  };

  const exportDailySalesXls = () => {
    const filename = `daily_sales_${selectedDate}.xls`;
    const headers = ['Time', 'Invoice', 'Customer', 'Items', 'Total', 'Payment'];

    let html = '<html><head><meta charset="UTF-8"></head><body><table border="1">';
    html += '<tr>' + headers.map((h) => `<th>${h}</th>`).join('') + '</tr>';

    reportData.transactions.forEach((tx) => {
      html += '<tr>' +
        `<td>${tx.time}</td>` +
        `<td>${tx.invoice}</td>` +
        `<td>${tx.customer}</td>` +
        `<td>${tx.items}</td>` +
        `<td>${tx.total}</td>` +
        `<td>${tx.payment}</td>` +
        '</tr>';
    });

    html += '</table><br/><table border="1">';
    html += '<tr><th colspan="2">Summary</th></tr>';
    html += `<tr><td>Date</td><td>${selectedDate}</td></tr>`;
    html += `<tr><td>Total Transactions</td><td>${reportData.summary.total_transactions}</td></tr>`;
    html += `<tr><td>Total Revenue</td><td>${reportData.summary.total_revenue}</td></tr>`;
    html += `<tr><td>Total Profit</td><td>${reportData.summary.total_profit}</td></tr>`;
    html += `<tr><td>Average Sale</td><td>${reportData.summary.average_sale}</td></tr>`;
    html += '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success('Daily Sales XLS export started');
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(value)}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const summary = reportData?.summary || {};
  const paymentMethods = summary?.by_payment_method || {};
  const transactions = reportData?.transactions || [];
 

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Sales Report</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow">
            <FiCalendar className="ml-3 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-lg focus:outline-none bg-transparent"
            />
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            onClick={handleExportExcel}
          >
            <FiDownload /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Revenue"
          value={summary.total_revenue}
          icon={FiDollarSign}
          color="bg-green-600"
        />
        <StatCard
          title="Total Profit"
          value={summary.total_profit} 
          icon={FiTrendingUp}
          color="bg-blue-600"
        />
        <StatCard
          title="Transactions"
          value={summary.total_transactions} 
          icon={FiShoppingBag}
          color="bg-purple-600"
        />
        <StatCard
          title="Average Sale"
          value={summary.average_sale} 
          icon={FiCreditCard}
          color="bg-orange-600"
        />
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Cash</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(paymentMethods.cash)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Transfer</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(paymentMethods.transfer)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">POS</p>
          <p className="text-xl font-bold text-purple-600">{formatCurrency(paymentMethods.pos)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Credit</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(paymentMethods.credit)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">{transaction.time}</td>
                  <td className="px-6 py-4 font-mono text-sm">{transaction.invoice}</td>
                  <td className="px-6 py-4">{transaction.customer}</td>
                  <td className="px-6 py-4">{transaction.items}</td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(transaction.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                      transaction.payment === 'cash' ? 'bg-green-100 text-green-800' :
                      transaction.payment === 'transfer' ? 'bg-blue-100 text-blue-800' :
                      transaction.payment === 'pos' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {transaction.payment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailySales;