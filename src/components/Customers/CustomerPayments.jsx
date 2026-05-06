import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiDollarSign, 
  FiCreditCard, 
  FiArrowLeft,
  FiPlus,
  FiX,
  FiEye,
  FiPrinter,
  FiSmartphone,
  FiBriefcase,
  FiChevronDown,
  FiPlusCircle,
  FiTrash2,
  FiFileText,
  FiAlertCircle,
  FiSearch,
  FiCheckCircle
} from 'react-icons/fi';
import { customerService } from '../../services/customer';
import { paymentService } from '../../services/payment';
import { saleService } from '../../services/sale';
import { bankService } from '../../services/bankService';
import toast from 'react-hot-toast';

const CustomerPayments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [customerSales, setCustomerSales] = useState([]);
  const [banks, setBanks] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [writeOffAmount, setWriteOffAmount] = useState('');
  const [writeOffReason, setWriteOffReason] = useState('');
  const [writeOffNotes, setWriteOffNotes] = useState('');
  const [writeOffToSale, setWriteOffToSale] = useState('');
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitComponents, setSplitComponents] = useState([
    { method: 'cash', amount: '', bank_id: '', reference: '' }
  ]);
  const [selectedBank, setSelectedBank] = useState('');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    sale_id: '',
    notes: ''
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomerData();
    fetchPayments();
    fetchBanks();
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      const response = await customerService.getCustomer(id);
      if (response.success) {
        setCustomer(response.data);
        await fetchCustomerSales();
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

  const fetchBanks = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${baseUrl}/banks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.data) {
        setBanks(data.data.filter(bank => bank.is_active === true));
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const fetchCustomerSales = async () => {
    try {
      const response = await saleService.getSales({ 
        customer_id: id,
        payment_status: ['pending', 'partial'],
        per_page: 100
      });
      
      if (response.success) {
        const salesWithBalance = (response.data.data || []).filter(sale => 
          sale.balance_due > 0 || sale.payment_status !== 'paid'
        );
        setCustomerSales(salesWithBalance);
      }
    } catch (error) {
      console.error('Error fetching customer sales:', error);
    }
  };

  const handleOpenWriteOffModal = () => {
    setWriteOffAmount('');
    setWriteOffReason('');
    setWriteOffNotes('');
    setWriteOffToSale('');
    setShowWriteOffModal(true);
  };

  const submitWriteOff = async () => {
    const amount = parseFloat(writeOffAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount to write off');
      return;
    }

    if (amount > customer?.current_balance) {
      toast.error(`Write off amount cannot exceed current balance of ${formatCurrency(customer.current_balance)}`);
      return;
    }

    if (!writeOffReason) {
      toast.error('Please select a reason for write-off');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await paymentService.writeOffBalance({
        customer_id: parseInt(id),
        sale_id: writeOffToSale || null,
        amount: amount,
        reason: writeOffReason,
        notes: writeOffNotes
      });

      if (response.success) {
        toast.success(`Successfully written off ${formatCurrency(amount)}`);
        setShowWriteOffModal(false);
        setWriteOffAmount('');
        setWriteOffReason('');
        setWriteOffNotes('');
        setWriteOffToSale('');
        await fetchCustomerData();
        await fetchPayments();
        await fetchCustomerSales();
      } else {
        toast.error(response.message || 'Failed to write off balance');
      }
    } catch (error) {
      console.error('Error writing off balance:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.errors || 'Failed to write off balance';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSplitComponent = () => {
    if (splitComponents.length >= 5) {
      toast.error('Maximum 5 split payment methods allowed');
      return;
    }
    setSplitComponents([
      ...splitComponents,
      { method: 'cash', amount: '', bank_id: '', reference: '' }
    ]);
  };

  const removeSplitComponent = (index) => {
    if (splitComponents.length === 1) {
      toast.error('At least one payment method is required');
      return;
    }
    const newComponents = splitComponents.filter((_, i) => i !== index);
    setSplitComponents(newComponents);
  };

  const updateSplitComponent = (index, field, value) => {
    const newComponents = [...splitComponents];
    newComponents[index][field] = value;
    
    if (field === 'method' && value !== 'bank') {
      newComponents[index].bank_id = '';
    }
    
    setSplitComponents(newComponents);
    const total = calculateSplitTotal();
    setPaymentData({ ...paymentData, amount: total.toString() });
  };

  const calculateSplitTotal = () => {
    return splitComponents.reduce((sum, comp) => sum + (parseFloat(comp.amount) || 0), 0);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (isSplitPayment) {
      const totalAmount = calculateSplitTotal();
      
      if (totalAmount <= 0) {
        toast.error('Please enter valid amounts for payment methods');
        return;
      }
      
      for (let i = 0; i < splitComponents.length; i++) {
        const comp = splitComponents[i];
        if (!comp.amount || parseFloat(comp.amount) <= 0) {
          toast.error(`Please enter amount for payment method ${i + 1}`);
          return;
        }
        
        if (comp.method === 'bank' && !comp.bank_id) {
          toast.error(`Please select bank for transfer payment ${i + 1}`);
          return;
        }
      }
      
      if (paymentData.sale_id) {
        const selectedSale = customerSales.find(s => s.id === parseInt(paymentData.sale_id));
        if (selectedSale && totalAmount > selectedSale.balance_due) {
          toast.error('Total amount exceeds balance due');
          return;
        }
      }
      
      const splitComponentsData = splitComponents.map(comp => ({
        method: comp.method,
        amount: parseFloat(comp.amount),
        bank_id: comp.method === 'bank' ? parseInt(comp.bank_id) : null,
        reference: comp.reference || null
      }));
      
      const paymentPayload = {
        customer_id: parseInt(id),
        amount: totalAmount,
        method: 'split',
        reference: paymentData.reference,
        date: paymentData.date,
        sale_id: paymentData.sale_id ? parseInt(paymentData.sale_id) : null,
        notes: paymentData.notes,
        is_split_payment: true,
        split_components: splitComponentsData
      };
      
      try {
        const response = await paymentService.createPayment(paymentPayload);
        if (response.success) {
          toast.success('Split payment recorded successfully');
          setShowPaymentModal(false);
          resetPaymentForm();
          await fetchCustomerData();
          await fetchPayments();
          await fetchCustomerSales();
        }
      } catch (error) {
        console.error('Error recording split payment:', error);
        toast.error('Failed to record split payment');
      }
      
    } else {
      if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (paymentData.method === 'bank' && !selectedBank) {
        toast.error('Please select a bank for transfer payment');
        return;
      }

      let reference = paymentData.reference;
      if (paymentData.method === 'bank' && selectedBank) {
        const bankName = banks.find(b => b.id === parseInt(selectedBank))?.name || '';
        reference = reference ? `${reference} (${bankName})` : bankName;
      }

      if (paymentData.sale_id) {
        const selectedSale = customerSales.find(s => s.id === parseInt(paymentData.sale_id));
        if (selectedSale && parseFloat(paymentData.amount) > selectedSale.balance_due) {
          toast.error('Amount exceeds balance due');
          return;
        }
      }

      const paymentPayload = {
        customer_id: parseInt(id),
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        bank_id: paymentData.method === 'bank' ? parseInt(selectedBank) : null,
        reference: reference,
        date: paymentData.date,
        sale_id: paymentData.sale_id ? parseInt(paymentData.sale_id) : null,
        notes: paymentData.notes,
        is_split_payment: false
      };

      try {
        const response = await paymentService.createPayment(paymentPayload);
        if (response.success) {
          toast.success('Payment recorded successfully');
          setShowPaymentModal(false);
          resetPaymentForm();
          await fetchCustomerData();
          await fetchPayments();
          await fetchCustomerSales();
        }
      } catch (error) {
        console.error('Error recording payment:', error);
        toast.error('Failed to record payment');
      }
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
    setSelectedBank('');
    setIsSplitPayment(false);
    setSplitComponents([
      { method: 'cash', amount: '', bank_id: '', reference: '' }
    ]);
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    try {
      const response = await paymentService.deletePayment(paymentId);
      if (response.success) {
        toast.success('Payment deleted successfully');
        await fetchCustomerData();
        await fetchPayments();
        await fetchCustomerSales();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  const handleReversePayment = async (paymentId) => {
    if (!window.confirm('Reverse this payment? This will add the amount back to customer balance.')) return;

    const reason = prompt('Please enter reason for reversal:');
    if (!reason) return;

    try {
      const response = await paymentService.reversePayment(paymentId, reason);
      if (response.success) {
        toast.success('Payment reversed successfully');
        await fetchCustomerData();
        await fetchPayments();
        await fetchCustomerSales();
      }
    } catch (error) {
      console.error('Error reversing payment:', error);
      toast.error('Failed to reverse payment');
    }
  };

  const handlePrintReceipt = (payment) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
            .receipt { max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .company-name { font-size: 20px; font-weight: bold; }
            .receipt-title { font-size: 16px; margin-top: 5px; }
            .divider { border-top: 1px dashed #333; margin: 15px 0; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; }
            .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="company-name">GORA GLOBAL CONCEPT LIMITED</div>
              <div class="receipt-title">PAYMENT RECEIPT</div>
            </div>
            <div class="divider"></div>
            <div class="row">
              <span>Receipt No:</span>
              <span>${payment.receipt_number || payment.id}</span>
            </div>
            <div class="row">
              <span>Date:</span>
              <span>${new Date(payment.payment_date).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span>Customer:</span>
              <span>${customer?.name}</span>
            </div>
            <div class="divider"></div>
            <div class="row">
              <span>Amount:</span>
              <span>₦${payment.amount.toLocaleString()}</span>
            </div>
            <div class="row">
              <span>Payment Method:</span>
              <span>${payment.payment_method || payment.method}</span>
            </div>
            ${payment.reference ? `<div class="row"><span>Reference:</span><span>${payment.reference}</span></div>` : ''}
            <div class="divider"></div>
            <div class="row total">
              <span>Total Paid:</span>
              <span>₦${payment.amount.toLocaleString()}</span>
            </div>
            <div class="footer">
              <p>Thank you for your payment!</p>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '₦0';
    }
    return `₦${Number(value).toLocaleString()}`;
  };

  const getMethodIcon = (method) => {
    const icons = {
      cash: '💵',
      bank: '🏦',
      pos: '💳',
      cheque: '📝',
      credit: '💳',
      split: '🔀',
      writeoff: '✍️'
    };
    return icons[method] || '💰';
  };

  const filteredPayments = payments.filter(payment => {
    if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.reference?.toLowerCase().includes(searchLower) ||
        payment.sale?.invoice_number?.toLowerCase().includes(searchLower) ||
        (payment.payment_method || payment.method)?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Customer Payments</h1>
        </div>
        <button onClick={() => setShowPaymentModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <FiPlus /> Record Payment
        </button>
      </div>

      {/* Customer Summary */}
      {customer && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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
              <p className="text-xl font-bold">{customer.credit_limit ? formatCurrency(customer.credit_limit) : 'No limit'}</p>
            </div>
          </div>

          {/* Write Off Section */}
          {customer.current_balance > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <FiAlertCircle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Outstanding Balance</h3>
                    <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(customer.current_balance)}</p>
                    <p className="text-sm text-red-600 mt-1">This customer has an outstanding balance.</p>
                  </div>
                </div>
                <button onClick={handleOpenWriteOffModal} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-md">
                  <FiFileText size={20} />
                  <span className="font-semibold">Write Off Balance</span>
                </button>
              </div>
            </div>
          )}

          {customer.current_balance === 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="text-green-600" size={24} />
                <div>
                  <p className="text-green-800 font-medium">All caught up!</p>
                  <p className="text-sm text-green-600">No outstanding balance.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {['all', 'completed', 'writeoff', 'reversed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-sm capitalize ${
                  filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-6 border-b">Payment History</h2>
        
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono text-xs">{payment.receipt_number || `RCP-${payment.id}`}</td>
                    <td className="px-6 py-4">
                      {payment.sale ? (
                        <Link to={`/sales/${payment.sale.id}`} className="text-blue-600 hover:text-blue-800 font-mono text-sm">
                          {payment.sale.invoice_number}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 capitalize">
                        <span>{getMethodIcon(payment.payment_method || payment.method)}</span>
                        {payment.payment_method || payment.method}
                        {payment.is_split_payment && <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-1 rounded">Split</span>}
                        {payment.is_write_off && <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-1 rounded">Write-off</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4 text-sm">{payment.reference || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : payment.status === 'reversed' 
                            ? 'bg-red-100 text-red-800' 
                            : payment.status === 'writeoff' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handlePrintReceipt(payment)} className="text-gray-600 hover:text-gray-800 p-1" title="Print Receipt">
                          <FiPrinter size={16} />
                        </button>
                        {payment.status === 'completed' && !payment.is_split_payment && !payment.is_write_off && (
                          <>
                            <button onClick={() => handleReversePayment(payment.id)} className="text-orange-600 hover:text-orange-800 p-1" title="Reverse Payment">
                              ↩️
                            </button>
                            <button onClick={() => handleDeletePayment(payment.id)} className="text-red-600 hover:text-red-800 p-1" title="Delete Payment">
                              <FiX size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isSplitPayment} onChange={(e) => setIsSplitPayment(e.target.checked)} className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Split Payment (Use multiple payment methods)</span>
              </label>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Apply to Sale (Optional)</label>
                <select value={paymentData.sale_id} onChange={(e) => setPaymentData({...paymentData, sale_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">General Payment (no specific sale)</option>
                  {customerSales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.invoice_number} - Balance: {formatCurrency(sale.balance_due)}
                    </option>
                  ))}
                </select>
              </div>

              {!isSplitPayment ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (₦) *</label>
                    <input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter amount" min="0" step="100" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Method *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['cash', 'bank', 'pos', 'cheque', 'credit'].map((method) => (
                        <button key={method} type="button" onClick={() => setPaymentData({...paymentData, method})} className={`p-2 border rounded-lg flex items-center justify-center gap-2 capitalize ${paymentData.method === method ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>
                          {method === 'cash' && <FiDollarSign />}
                          {method === 'bank' && <FiSmartphone />}
                          {method === 'pos' && <FiCreditCard />}
                          {method === 'cheque' && <FiBriefcase />}
                          {method === 'credit' && <FiCreditCard />}
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentData.method === 'bank' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Bank *</label>
                      <div className="relative">
                        <button type="button" onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)} className="w-full px-3 py-2 border rounded-lg flex items-center justify-between">
                          <span>{selectedBank ? banks.find(b => b.id === parseInt(selectedBank))?.name : 'Select Bank'}</span>
                          <FiChevronDown className={`transition-transform ${isBankDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isBankDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {banks.map((bank) => (
                              <button key={bank.id} type="button" onClick={() => { setSelectedBank(bank.id.toString()); setIsBankDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                                {bank.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium">Payment Breakdown *</label>
                    <button type="button" onClick={addSplitComponent} className="text-blue-600 text-sm flex items-center gap-1">
                      <FiPlusCircle size={14} /> Add Method
                    </button>
                  </div>
                  {splitComponents.map((component, index) => (
                    <div key={index} className="border-b pb-3 mb-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">Method {index + 1}</span>
                        {splitComponents.length > 1 && <button type="button" onClick={() => removeSplitComponent(index)} className="text-red-500"><FiTrash2 size={16} /></button>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={component.method} onChange={(e) => updateSplitComponent(index, 'method', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
                          <option value="cash">Cash</option>
                          <option value="bank">Bank Transfer</option>
                          <option value="pos">POS</option>
                          <option value="cheque">Cheque</option>
                          <option value="credit">Credit</option>
                        </select>
                        <input type="number" placeholder="Amount" value={component.amount} onChange={(e) => updateSplitComponent(index, 'amount', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" min="0" step="100" />
                      </div>
                      {component.method === 'bank' && (
                        <select value={component.bank_id} onChange={(e) => updateSplitComponent(index, 'bank_id', e.target.value)} className="w-full mt-2 px-2 py-1 border rounded text-sm">
                          <option value="">Select Bank</option>
                          {banks.map((bank) => (
                            <option key={bank.id} value={bank.id}>{bank.name}</option>
                          ))}
                        </select>
                      )}
                      <input type="text" placeholder="Reference (optional)" value={component.reference} onChange={(e) => updateSplitComponent(index, 'reference', e.target.value)} className="w-full mt-2 px-2 py-1 border rounded text-sm" />
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(calculateSplitTotal())}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Reference (Optional)</label>
                <input type="text" value={paymentData.reference} onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Transaction reference" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <input type="date" value={paymentData.date} onChange={(e) => setPaymentData({...paymentData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea value={paymentData.notes} onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})} rows="2" className="w-full px-3 py-2 border rounded-lg" placeholder="Additional notes" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{isSplitPayment ? 'Record Split Payment' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Write Off Modal */}
      {showWriteOffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowWriteOffModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Write Off Balance</h2>
              <button onClick={() => setShowWriteOffModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="text-yellow-600 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Warning: This action cannot be undone</p>
                    <p className="text-xs text-yellow-700 mt-1">Writing off a balance will remove the outstanding amount from the customer's account.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Balance</label>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(customer?.current_balance)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount to Write Off *</label>
                <input 
                  type="number" 
                  value={writeOffAmount} 
                  onChange={(e) => setWriteOffAmount(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" 
                  placeholder="Enter amount to write off" 
                  min="0" 
                  max={customer?.current_balance} 
                  step="100" 
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">Max: {formatCurrency(customer?.current_balance)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Apply to Specific Sale (Optional)</label>
                <select value={writeOffToSale} onChange={(e) => setWriteOffToSale(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Apply to overall balance</option>
                  {customerSales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.invoice_number} - Balance: {formatCurrency(sale.balance_due)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason for Write-off *</label>
                <select value={writeOffReason} onChange={(e) => setWriteOffReason(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select reason</option>
                  <option value="bad_debt">Bad Debt - Customer unable to pay</option>
                  <option value="discount">Discount - Special discount offered</option>
                  <option value="refund">Refund - Service/product issue</option>
                  <option value="error">Error - Billing error</option>
                  <option value="other">Other - Please specify</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea 
                  value={writeOffNotes} 
                  onChange={(e) => setWriteOffNotes(e.target.value)} 
                  rows="3" 
                  className="w-full px-3 py-2 border rounded-lg" 
                  placeholder="Enter additional details about this write-off..." 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowWriteOffModal(false)} 
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={submitWriteOff} 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Write Off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPayments;