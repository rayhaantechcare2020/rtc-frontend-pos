import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiCheck, 
  FiUser, 
  FiSearch, 
  FiPrinter,
  FiDollarSign,
  FiCreditCard,
  FiSmartphone,
  FiBriefcase,
  FiUpload,
  FiInfo,
  FiPlus,
  FiTrash2
} from 'react-icons/fi';
import { saleService } from '../../services/sale';
import { customerService } from '../../services/customer';
import { companyService } from '../../services/company';
import toast from 'react-hot-toast';

const Checkout = ({ cart, onClose, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [defaultCustomerWasSet, setDefaultCustomerWasSet] = useState(false);
  const [isCreditOnly, setIsCreditOnly] = useState(false);
  const [printerSettings, setPrinterSettings] = useState({
    default_printer_type: 'thermal',
    thermal_width: '80mm',
    auto_print: true,
    print_copies: 1,
    print_logo: true,
    print_barcode: true
  });
  
  // Multiple payments state
  const [payments, setPayments] = useState([
    { method: 'cash', amount: 0, bank_id: null, transaction_reference: null, deposit_slip: null }
  ]);
  
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(cart.discount || 0);
  
  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * (discount / 100)) || 0;
    const finalTotal = subtotal - discountAmount;
    
    return { subtotal, discountAmount, finalTotal };
  };

  const { subtotal, discountAmount, finalTotal } = calculateTotals();
  
  // Calculate total paid from all payment methods
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const changeDue = Math.max(0, totalPaid - finalTotal);
  const balanceDue = Math.max(0, finalTotal - totalPaid);

  // Load customers, banks, and printer settings on mount
  useEffect(() => {
    fetchCustomers();
    fetchBanks();
    fetchPrinterSettings();
  }, []);

  // Auto-select Walk-in Customer when customers load
  useEffect(() => {
    if (!defaultCustomerWasSet && customers.length > 0 && !selectedCustomer) {
      const walkIn = customers.find(c => c.name === 'Walk-in Customer');
      if (walkIn) {
        setSelectedCustomer(walkIn);
      }
      setDefaultCustomerWasSet(true);
    }
  }, [customers, selectedCustomer, defaultCustomerWasSet]);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomersList();
      if (response.success) {
        setCustomers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
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

  // Payment method handlers
  const addPaymentMethod = () => {
    if (isCreditOnly) {
      toast.error('Cannot add payment methods in credit-only mode. Cancel credit mode first.');
      return;
    }
    setPayments([...payments, { method: 'cash', amount: 0, bank_id: null, transaction_reference: null, deposit_slip: null }]);
  };

  const removePaymentMethod = (index) => {
    if (payments.length > 1) {
      const newPayments = payments.filter((_, i) => i !== index);
      setPayments(newPayments);
    } else {
      toast.error('At least one payment method is required');
    }
  };

  const updatePaymentMethod = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    
    // Reset bank fields when changing from bank to other methods
    if (field === 'method' && !['bank', 'transfer'].includes(value)) {
      newPayments[index].bank_id = null;
      newPayments[index].transaction_reference = null;
      newPayments[index].deposit_slip = null;
    }
    
    setPayments(newPayments);
  };

  const updatePaymentAmount = (index, amount) => {
    const newPayments = [...payments];
    newPayments[index].amount = parseFloat(amount) || 0;
    setPayments(newPayments);
  };

  const handleFileUpload = (index, file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, or PDF files are allowed');
        return;
      }
      
      const newPayments = [...payments];
      newPayments[index].deposit_slip = file;
      setPayments(newPayments);
      toast.success('Deposit slip uploaded');
    }
  };

  const distributeRemainingAmount = () => {
    if (isCreditOnly) {
      toast.error('Cannot distribute amount in credit-only mode');
      return;
    }
    const remaining = finalTotal - totalPaid;
    if (remaining > 0) {
      const newPayments = [...payments];
      newPayments[0].amount = (newPayments[0].amount || 0) + remaining;
      setPayments(newPayments);
    }
  };

  const displayReceipt = async (saleId) => {
    try {
      setPrinting(true);
      
      const receiptType = printerSettings.default_printer_type || 'thermal';
      const copies = Math.max(1, Number(printerSettings.print_copies) || 1);
      const autoPrint = printerSettings.auto_print;
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('You must be logged in');
        return;
      }
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const typesToPrint = receiptType === 'both' ? ['thermal', 'pdf'] : [receiptType];

      for (const type of typesToPrint) {
        for (let i = 0; i < copies; i++) {
          const encodedToken = encodeURIComponent(token);
          const url = `${baseUrl}/pos/receipt/${saleId}/print?type=${type}&action=display&autoprint=${autoPrint}&token=${encodedToken}`;
          
          const printWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes');
          
          if (!printWindow) {
            toast.error('Please allow popups for this site');
          }
        }
      }
      
      toast.success('Receipt window opened');
    } catch (error) {
      console.error('Error displaying receipt:', error);
      toast.error('Failed to display receipt');
    } finally {
      setPrinting(false);
    }
  };
  
  // Handle credit payment - Full credit sale
  const handleCreditPayment = () => {
    // Clear all existing payments and set credit with full amount
    setPayments([{ 
      method: 'credit', 
      amount: finalTotal,  // Set amount to total for credit sale
      bank_id: null, 
      transaction_reference: null, 
      deposit_slip: null 
    }]);
    setIsCreditOnly(true);
  };

  // Add credit for remaining balance
  const addCreditPayment = () => {
    const remaining = balanceDue;
    if (remaining > 0) {
      const newPayments = [...payments];
      newPayments.push({ 
        method: 'credit', 
        amount: remaining, 
        bank_id: null, 
        transaction_reference: null, 
        deposit_slip: null 
      });
      setPayments(newPayments);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
    setSearchTerm('');
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const response = await customerService.createCustomer({
        ...newCustomer,
        status: 'active'
      });
      
      if (response.success) {
        toast.success('Customer added successfully');
        setCustomers([...customers, response.data]);
        setSelectedCustomer(response.data);
        setShowNewCustomerForm(false);
        setNewCustomer({ name: '', phone: '', email: '' });
      }
    } catch (error) {
      toast.error('Failed to add customer');
    }
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'cash': return <FiDollarSign />;
      case 'transfer': return <FiSmartphone />;
      case 'pos': return <FiCreditCard />;
      case 'bank': return <FiCreditCard />;
      case 'credit': return <FiBriefcase />;
      default: return <FiDollarSign />;
    }
  };

  const getPaymentLabel = (method) => {
    switch(method) {
      case 'cash': return 'Cash';
      case 'transfer': return 'Bank Transfer';
      case 'pos': return 'POS';
      case 'bank': return 'Bank Transfer';
      case 'credit': return 'Credit';
      default: return method;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // For credit-only sales, we don't need totalPaid to match finalTotal
    if (!isCreditOnly && totalPaid < finalTotal) {
      const remaining = finalTotal - totalPaid;
      toast.error(`Please enter full payment amount or use credit. Balance due: ₦${remaining.toLocaleString()}`);
      return;
    }

    // Validate bank payments
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      if (['bank', 'transfer'].includes(payment.method) && payment.amount > 0) {
        if (!payment.bank_id) {
          toast.error(`Please select a bank for payment method ${i + 1}`);
          return;
        }
        // Transaction reference is optional
      }
    }

    setLoading(true);

    try {
      // Prepare items array
      const items = cart.items.map(item => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price)
      }));

      // Prepare payments array (only include payments with amount > 0)
      const validPayments = payments
        .filter(p => p.amount > 0)
        .map(p => ({
          method: p.method,
          amount: parseFloat(p.amount),
          bank_id: p.bank_id || null,
          transaction_reference: p.transaction_reference || null
        }));

      // Build checkout data
      let checkoutData = {
        items: items,
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || 'Walk-in Customer',
        customer_phone: selectedCustomer?.phone || '',
        discount: discountAmount,
        notes: notes || '',
        total: parseFloat(finalTotal),
        payments: validPayments
      };

      console.log('Checkout data:', checkoutData);
      
      const response = await saleService.checkout(checkoutData);
      
      if (response.success) {
        toast.success('Sale completed successfully!');
        if (printerSettings.auto_print) {
          await displayReceipt(response.data.sale.id);
        }
        onComplete(response.data);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      
      if (error.response?.status === 422 && error.response.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        errorMessages.forEach(msg => toast.error(msg));
      } else {
        toast.error(error.response?.data?.message || 'Checkout failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine if the Complete button should be disabled
  const isSubmitDisabled = () => {
    if (loading) return true;
    if (isCreditOnly) return false; // Credit-only sales can be completed with 0 payment
    return totalPaid < finalTotal;
  };

  // Get button text based on payment type
  const getButtonText = () => {
    if (loading) return 'Processing...';
    if (isCreditOnly) return `Complete Credit Sale (₦${finalTotal.toLocaleString()})`;
    return `Complete Sale (₦${totalPaid.toLocaleString()})`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Checkout</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
              {cart.items.map(item => (
                <div key={item.product_id} className="flex justify-between">
                  <span>{item.name} x{item.quantity}</span>
                  <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Discount (%):</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="1"
                  className="w-20 px-2 py-1 text-right border rounded text-sm"
                />
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount Amount:</span>
                  <span>-₦{discountAmount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold pt-1 border-t">
                <span>Total:</span>
                <span className="text-blue-600">₦{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            
            {!showNewCustomerForm ? (
              <>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-2 border rounded-lg mb-2">
                    <div>
                      <p className="font-medium">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && (
                        <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                      )}
                      {selectedCustomer.current_balance > 0 && (
                        <p className="text-xs text-orange-600">
                          Balance: ₦{selectedCustomer.current_balance.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search customers..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowCustomerDropdown(true);
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNewCustomerForm(true)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm whitespace-nowrap"
                      >
                        + New
                      </button>
                    </div>

                    {showCustomerDropdown && searchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(customer => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleSelectCustomer(customer)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <FiUser className="text-gray-400" />
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                {customer.phone && (
                                  <p className="text-sm text-gray-500">{customer.phone}</p>
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No customers found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="border rounded-lg p-3 space-y-3">
                <h4 className="font-medium">Add New Customer</h4>
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddNewCustomer}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    Save Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCustomerForm(false);
                      setNewCustomer({ name: '', phone: '', email: '' });
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods Section */}
          <div>
            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
              <label className="block text-sm font-medium">Payment Methods</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addPaymentMethod}
                  disabled={isCreditOnly}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                >
                  <FiPlus size={14} /> Add Payment
                </button>
                {!isCreditOnly && (
                  <button
                    type="button"
                    onClick={handleCreditPayment}
                    className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                  >
                    <FiBriefcase size={14} /> Credit Only
                  </button>
                )}
                {isCreditOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreditOnly(false);
                      setPayments([{ method: 'cash', amount: 0, bank_id: null, transaction_reference: null, deposit_slip: null }]);
                    }}
                    className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <FiX size={14} /> Cancel Credit
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              {payments.map((payment, index) => (
                <div key={index} className="border rounded-lg p-3 relative">
                  {payments.length > 1 && !isCreditOnly && (
                    <button
                      type="button"
                      onClick={() => removePaymentMethod(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Method</label>
                      <select
                        value={payment.method}
                        onChange={(e) => updatePaymentMethod(index, 'method', e.target.value)}
                        className="w-full border rounded-lg px-2 py-1 text-sm"
                        disabled={isCreditOnly}
                      >
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="pos">POS</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Amount (₦)
                        {payment.method === 'credit' && isCreditOnly && (
                          <span className="text-xs text-purple-600 ml-1">(Full amount)</span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => updatePaymentAmount(index, e.target.value)}
                        min="0"
                        step="100"
                        className="w-full border rounded-lg px-2 py-1 text-sm"
                        placeholder="0.00"
                        disabled={isCreditOnly && payment.method === 'credit'}
                      />
                      {payment.method === 'credit' && !isCreditOnly && payment.amount === 0 && (
                        <p className="text-xs text-purple-500 mt-1">Amount will be added to customer balance</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Bank Details for Bank/Transfer payments */}
                  {['bank', 'transfer'].includes(payment.method) && payment.amount > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Select Bank</label>
                          <select
                            value={payment.bank_id || ''}
                            onChange={(e) => updatePaymentMethod(index, 'bank_id', e.target.value)}
                            className="w-full border rounded-lg px-2 py-1 text-sm"
                          >
                            <option value="">Select bank...</option>
                            {banks.map(bank => (
                              <option key={bank.id} value={bank.id}>
                                {bank.name} - {bank.account_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Transaction Reference</label>
                          <input
                            type="text"
                            value={payment.transaction_reference || ''}
                            onChange={(e) => updatePaymentMethod(index, 'transaction_reference', e.target.value)}
                            className="w-full border rounded-lg px-2 py-1 text-sm"
                            placeholder="e.g., TRF-123456 (Optional)"
                          />
                        </div>
                      </div>
                      
                      {/* Deposit Slip Upload */}
                      <div className="mt-2">
                        <label className="block text-xs font-medium mb-1">Deposit Slip (Optional)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload(index, e.target.files[0])}
                            accept="image/jpeg,image/png,image/jpg,application/pdf"
                            className="flex-1 border rounded-lg px-2 py-1 text-xs"
                          />
                          <FiUpload className="text-gray-400" />
                        </div>
                        {payment.deposit_slip && (
                          <p className="text-xs text-green-600 mt-1">✓ File uploaded: {payment.deposit_slip.name}</p>
                        )}
                      </div>
                      
                      {/* Display selected bank info */}
                      {payment.bank_id && banks.find(b => b.id == payment.bank_id) && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p>Account: {banks.find(b => b.id == payment.bank_id)?.account_number}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className={`p-3 rounded-lg ${
            isCreditOnly ? 'bg-purple-50' : (totalPaid >= finalTotal ? 'bg-green-50' : 'bg-yellow-50')
          }`}>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">₦{finalTotal.toLocaleString()}</span>
              </div>
              {!isCreditOnly && (
                <>
                  <div className="flex justify-between">
                    <span>Total Paid:</span>
                    <span className="font-bold text-green-600">₦{totalPaid.toLocaleString()}</span>
                  </div>
                  {changeDue > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Change Due:</span>
                      <span>₦{changeDue.toLocaleString()}</span>
                    </div>
                  )}
                  {balanceDue > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Balance Due:</span>
                      <span>₦{balanceDue.toLocaleString()}</span>
                    </div>
                  )}
                  {totalPaid < finalTotal && (
                    <button
                      type="button"
                      onClick={distributeRemainingAmount}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 w-full text-center"
                    >
                      Add remaining amount (₦{balanceDue.toLocaleString()}) to first payment
                    </button>
                  )}
                  {balanceDue > 0 && (
                    <button
                      type="button"
                      onClick={addCreditPayment}
                      className="mt-1 text-xs text-purple-600 hover:text-purple-800 w-full text-center"
                    >
                      Put remaining balance (₦{balanceDue.toLocaleString()}) on Credit
                    </button>
                  )}
                </>
              )}
              {isCreditOnly && (
                <div className="flex justify-between text-purple-600">
                  <span>Credit Sale:</span>
                  <span className="font-bold">₦{finalTotal.toLocaleString()} will be added to customer balance</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any notes about this sale..."
            />
          </div>

          {/* Printer Settings Indicator */}
          {printerSettings.auto_print && (
            <div className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 p-2 rounded">
              <FiPrinter size={12} />
              <span>
                Auto-print {printerSettings.default_printer_type} receipt 
                ({printerSettings.print_copies} copy/{printerSettings.print_copies > 1 ? 'ies' : 'y'})
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled()}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiCheck /> {getButtonText()}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;