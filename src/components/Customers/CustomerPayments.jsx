import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiDollarSign, 
  FiCreditCard, 
  FiCalendar,
  FiArrowLeft,
  FiPlus,
  FiX,
  FiEye,
  FiPrinter,
  FiDownload
} from 'react-icons/fi';
import { customerService } from '../../services/customer';
import { paymentService } from '../../services/payment';
import { saleService } from '../../services/sale';
import toast from 'react-hot-toast';

const CustomerPayments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [customerSales, setCustomerSales] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSaleSelector, setShowSaleSelector] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    sale_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomerData();
    fetchPayments();
  }, [id]);

  // In fetchCustomerSales function
const fetchCustomerSales = async () => {
  try {
    const response = await saleService.getSales({ 
      customer_id: id,
      payment_status: ['pending', 'partial'], // Get unpaid and partially paid
      per_page: 100
    });
    
    if (response.success) {
      // Filter to only show sales with balance > 0
      const salesWithBalance = (response.data.data || []).filter(sale => 
        sale.balance_due > 0 || sale.payment_status !== 'paid'
      );
      setCustomerSales(salesWithBalance);
    }
  } catch (error) {
    console.error('Error fetching customer sales:', error);
  }
};

  const fetchCustomerData = async () => {
    try {
      const response = await customerService.getCustomer(id);
      if (response.success) {
        setCustomer(response.data);
        fetchCustomerSales(); // Fetch sales after we have customer
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer');
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await paymentService.getCustomerPayments(id);
      if (response.success) {
        setPayments(response.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // const fetchCustomerSales = async () => {
  //   try {
  //     const response = await saleService.getSales({ 
  //       customer_id: id,
  //       payment_status: ['pending', 'partial'],
  //       per_page: 100
  //     });
  //     if (response.success) {
  //       setCustomerSales(response.data.data || []);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching customer sales:', error);
  //   }
  // };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentData.sale_id && paymentData.amount > 0) {
      const selectedSale = customerSales.find(s => s.id === parseInt(paymentData.sale_id));
      if (selectedSale && paymentData.amount > selectedSale.balance_due) {
        toast.error(`Amount exceeds balance due (₦${selectedSale.balance_due.toLocaleString()})`);
        return;
      }
    }

    try {
      const response = await paymentService.createPayment({
        customer_id: parseInt(id),
        ...paymentData,
        amount: parseFloat(paymentData.amount),
        sale_id: paymentData.sale_id ? parseInt(paymentData.sale_id) : null
      });

      if (response.success) {
        toast.success('Payment recorded successfully');
        setShowPaymentModal(false);
        resetPaymentForm();
        fetchCustomerData();
        fetchPayments();
        fetchCustomerSales(); // Refresh sales list
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const resetPaymentForm = () => {
    setPaymentData({
      amount: '',
      method: 'cash',
      reference: '',
      date: new Date().toISOString().split('T')[0],
      sale_id: '',
      notes: ''
    });
    setShowSaleSelector(false);
  };

  const handleDeletePayment = async (paymentId, amount) => {
    if (!window.confirm(`Are you sure you want to delete this payment of ₦${amount.toLocaleString()}?`)) {
      return;
    }

    try {
      const response = await paymentService.deletePayment(paymentId);
      if (response.success) {
        toast.success('Payment deleted successfully');
        fetchCustomerData();
        fetchPayments();
        fetchCustomerSales();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  const handleReversePayment = async (paymentId, amount) => {
    if (!window.confirm(`Reverse this payment of ₦${amount.toLocaleString()}? This will add the amount back to customer balance.`)) {
      return;
    }

    const reason = prompt('Please enter reason for reversal:');
    if (!reason) return;

    try {
      const response = await paymentService.reversePayment(paymentId, reason);
      if (response.success) {
        toast.success('Payment reversed successfully');
        fetchCustomerData();
        fetchPayments();
        fetchCustomerSales();
      }
    } catch (error) {
      console.error('Error reversing payment:', error);
      toast.error('Failed to reverse payment');
    }
  };

  const formatCurrency = (value) => {
    return `₦${Number(value).toLocaleString()}`;
  };

  const getMethodIcon = (method) => {
    switch(method) {
      case 'cash': return '💵';
      case 'transfer': return '🏦';
      case 'pos': return '💳';
      case 'cheque': return '📝';
      default: return '💰';
    }
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Customer Payments</h1>
        </div>
        
        <button
          onClick={() => setShowPaymentModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <FiPlus /> Record Payment
        </button>
      </div>

      {/* Customer Summary */}
      {customer && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="text-lg font-medium">{customer.name}</p>
              <p className="text-sm text-gray-500">{customer.phone || 'No phone'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium">{customer.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className={`text-2xl font-bold ${customer.current_balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(customer.current_balance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Credit Limit</p>
              <p className="text-xl font-bold">
                {customer.credit_limit ? formatCurrency(customer.credit_limit) : 'No limit'}
              </p>
            </div>
          </div>

          {/* Outstanding Sales Alert */}
          {customerSales.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-bold">{customerSales.length}</span> unpaid sale(s) with outstanding balance.
                <button
                  onClick={() => setShowSaleSelector(!showSaleSelector)}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  {showSaleSelector ? 'Hide' : 'View'}
                </button>
              </p>
            </div>
          )}

          {/* Unpaid Sales List */}
          {showSaleSelector && customerSales.length > 0 && (
            <div className="mt-4 border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Invoice</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-right">Paid</th>
                    <th className="px-4 py-2 text-right">Balance</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customerSales.map(sale => (
                    <tr key={sale.id}>
                      <td className="px-4 py-2 font-mono text-xs">{sale.invoice_number}</td>
                      <td className="px-4 py-2">{new Date(sale.sale_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(sale.total)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(sale.amount_paid || 0)}</td>
                      <td className="px-4 py-2 text-right font-bold text-orange-600">
                        {formatCurrency(sale.balance_due || sale.total)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Link
                          to={`/sales/${sale.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiEye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-6 border-b">Payment History</h2>
        
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {payment.sale ? (
                        <Link 
                          to={`/sales/${payment.sale.id}`}
                          className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                        >
                          {payment.sale.invoice_number}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 capitalize">
                        <span>{getMethodIcon(payment.payment_method)}</span>
                        {payment.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">{payment.reference || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'reversed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payment.notes || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === 'completed' && (
                        <>
                          <button
                            onClick={() => handleReversePayment(payment.id, payment.amount)}
                            className="text-orange-600 hover:text-orange-800 mr-3"
                            title="Reverse Payment"
                          >
                            ↩️
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment.id, payment.amount)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Payment"
                          >
                            <FiX size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td colSpan="3" className="px-6 py-3 text-right">Total Payments:</td>
                  <td className="px-6 py-3 text-right text-green-600">
                    {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                  </td>
                  <td colSpan="4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Record Payment</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  resetPaymentForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount (₦) *</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  min="0"
                  step="100"
                  required
                />
              </div>

              {/* Sale Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Apply to Sale (Optional)</label>
                <select
                  value={paymentData.sale_id}
                  onChange={(e) => setPaymentData({...paymentData, sale_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">General Payment (no specific sale)</option>
                  {customerSales.map(sale => (
                    <option key={sale.id} value={sale.id}>
                      {sale.invoice_number} - N{sale.balance_due.toLocaleString()} due
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a sale to apply this payment to a specific invoice
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['cash', 'transfer', 'pos', 'cheque'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentData({...paymentData, method})}
                      className={`p-2 border rounded-lg flex items-center justify-center gap-2 capitalize ${
                        paymentData.method === method
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span>{getMethodIcon(method)}</span>
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium mb-2">Reference (Optional)</label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Transaction reference"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <input
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes"
                />
              </div>

              {/* Balance Preview */}
              {customer && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>Current Balance:</span>
                    <span className="font-medium">{formatCurrency(customer.current_balance)}</span>
                  </p>
                  {paymentData.amount && (
                    <p className="text-sm font-medium mt-1 flex justify-between text-green-600">
                      <span>New Balance:</span>
                      <span>{formatCurrency(customer.current_balance - parseFloat(paymentData.amount || 0))}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetPaymentForm();
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPayments;