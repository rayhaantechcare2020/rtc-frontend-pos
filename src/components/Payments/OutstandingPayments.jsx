import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, 
  FiDollarSign, 
  FiAlertCircle,
  FiEye,
  FiDownload,
  FiMail
} from 'react-icons/fi';
import { paymentService } from '../../services/payment';
import { exportToExcel } from '../../utils/excelExport';
import { customerService } from '../../services/customer';
import toast from 'react-hot-toast';

const OutstandingPayments = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  useEffect(() => {
    fetchOutstanding();
  }, []);

  const fetchOutstanding = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getOutstandingPayments();
      if (response.success) {
        setCustomers(response.data.customers || []);
        setTotalOutstanding(response.data.total_outstanding || 0);
      }
    } catch (error) {
      console.error('Error fetching outstanding payments:', error);
      toast.error('Failed to load outstanding payments');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = customers.map(c => ({
      'Customer Name': c.name,
      'Phone': c.phone || '-',
      'Email': c.email || '-',
      'Current Balance': c.current_balance,
      'Credit Limit': c.credit_limit || 'No limit',
      'Over Limit': c.current_balance > (c.credit_limit || Infinity) ? 'Yes' : 'No'
    }));

    exportToExcel(exportData, 'outstanding_payments', 'Outstanding');
    toast.success(`Exported ${exportData.length} customers`);
  };

  const formatCurrency = (value) => {
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
        <h1 className="text-2xl font-bold">Outstanding Payments</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <FiDownload /> Export
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Total Outstanding</p>
            <p className="text-3xl font-bold">{formatCurrency(totalOutstanding)}</p>
            <p className="text-sm opacity-90 mt-1">{customers.length} customers with balance</p>
          </div>
          <FiAlertCircle size={48} className="opacity-50" />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No outstanding payments</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit Limit</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => {
                  const overLimit = customer.current_balance > (customer.credit_limit || Infinity);
                  
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium">{customer.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        {customer.phone && <p>📞 {customer.phone}</p>}
                        {customer.email && <p className="text-sm text-gray-500">✉️ {customer.email}</p>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${overLimit ? 'text-red-600' : 'text-orange-600'}`}>
                          {formatCurrency(customer.current_balance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {customer.credit_limit ? formatCurrency(customer.credit_limit) : 'No limit'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {overLimit ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            Over Limit
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/customers/${customer.id}/payments`}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          title="View Payments"
                        >
                          <FiEye />
                        </Link>
                        {customer.email && (
                          <a
                            href={`mailto:${customer.email}?subject=Payment Reminder&body=Dear ${customer.name},%0D%0A%0D%0AThis is a reminder that you have an outstanding balance of ${formatCurrency(customer.current_balance)}.`}
                            className="text-green-600 hover:text-green-800"
                            title="Send Email Reminder"
                          >
                            <FiMail />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutstandingPayments;