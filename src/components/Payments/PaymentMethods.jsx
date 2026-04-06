import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, 
  FiCreditCard, 
  FiSmartphone,
  FiFileText,
  FiPieChart,
  FiDownload
} from 'react-icons/fi';
import { paymentService } from '../../services/payment';
import { exportToExcel } from '../../utils/excelExport';
import toast from 'react-hot-toast';

const PaymentMethods = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentMethodsStats();
      //console.log('Payment Methods Stats Response:', response);
      
      if (response.success) {
        const statsData = response.data || [];
        setStats(statsData);
        const total = statsData.reduce((sum, item) => sum + (item.total || 0), 0);
        setTotalAmount(total);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      toast.error('Failed to load payment statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = stats.map(s => ({
      'Payment Method': s.payment_method?.toUpperCase() || 'UNKNOWN',
      'Number of Transactions': s.count || 0,
      'Total Amount': s.total || 0,
      'Percentage': totalAmount ? ((s.total / totalAmount) * 100).toFixed(1) + '%' : '0%'
    }));

    exportToExcel(exportData, 'payment_methods_stats', 'Payment Methods');
    toast.success('Statistics exported');
  };

  const getMethodIcon = (method) => {
    switch(method?.toLowerCase()) {
      case 'cash': return <FiDollarSign className="w-8 h-8 text-green-600" />;
      case 'transfer': return <FiSmartphone className="w-8 h-8 text-blue-600" />;
      case 'pos': return <FiCreditCard className="w-8 h-8 text-purple-600" />;
      case 'cheque': return <FiFileText className="w-8 h-8 text-orange-600" />;
      case 'credit': return <FiCreditCard className="w-8 h-8 text-red-600" />;
      default: return <FiDollarSign className="w-8 h-8 text-gray-600" />;
    }
  };

  const getMethodName = (method) => {
    switch(method?.toLowerCase()) {
      case 'cash': return 'Cash';
      case 'transfer': return 'Bank Transfer';
      case 'pos': return 'POS';
      case 'cheque': return 'Cheque';
      case 'credit': return 'Credit';
      default: return method || 'Unknown';
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '₦0';
    }
    return `₦${Number(value).toLocaleString()}`;
  };

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
        <h1 className="text-2xl font-bold">Payment Methods Analysis</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow p-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              className="px-2 py-1 border rounded focus:outline-none dark:bg-gray-700"
            />
            <span>-</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              className="px-2 py-1 border rounded focus:outline-none dark:bg-gray-700"
            />
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No payment data available</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
            {stats.map((stat) => {
              const percentage = totalAmount ? ((stat.total / totalAmount) * 100).toFixed(1) : 0;
              
              return (
                <div key={stat.payment_method} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    {getMethodIcon(stat.payment_method)}
                    <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
                  </div>
                  <h3 className="text-lg font-semibold capitalize mb-2">
                    {getMethodName(stat.payment_method)}
                  </h3>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                    {formatCurrency(stat.total)}
                  </p>
                  <p className="text-sm text-gray-500">{stat.count} transactions</p>
                </div>
              );
            })}
          </div>

          {/* Detailed Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <h2 className="text-lg font-semibold p-6 border-b">Detailed Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Average</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.map((stat) => (
                    <tr key={stat.payment_method}>
                      <td className="px-6 py-4 font-medium capitalize">
                        {getMethodName(stat.payment_method)}
                      </td>
                      <td className="px-6 py-4 text-right">{stat.count || 0}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">
                        {formatCurrency(stat.total)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency(stat.count ? stat.total / stat.count : 0)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{totalAmount ? ((stat.total / totalAmount) * 100).toFixed(1) : 0}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${totalAmount ? (stat.total / totalAmount) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td className="px-6 py-3 font-bold">Total</td>
                    <td className="px-6 py-3 text-right font-bold">
                      {stats.reduce((sum, s) => sum + (s.count || 0), 0)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-green-600">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold">
                      {formatCurrency(stats.length ? totalAmount / stats.length : 0)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentMethods;