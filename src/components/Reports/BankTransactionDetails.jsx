// components/reports/BankTransactionDetails.js
import React from 'react';
import { FiX, FiPrinter, FiDownload, FiCopy } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const BankTransactionDetails = ({ transaction, onClose }) => {
  const { sale, bank_details, transaction: trans, customer } = transaction;

  const formatCurrency = (amount) => {
    return `₦${Number(amount).toLocaleString()}`;
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm:ss');
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const printTransaction = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Details - ${sale.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          .section h3 { margin-top: 0; color: #333; }
          .row { display: flex; margin-bottom: 10px; }
          .label { font-weight: bold; width: 150px; }
          .value { flex: 1; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .total-row { font-weight: bold; background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Bank Transaction Details</h2>
          <p>${sale.invoice_number}</p>
          <p>${formatDate(sale.created_at)}</p>
        </div>
        
        <div class="section">
          <h3>Transaction Information</h3>
          <div class="row"><div class="label">Reference:</div><div class="value">${trans.reference}</div></div>
          <div class="row"><div class="label">Date:</div><div class="value">${formatDate(trans.date)}</div></div>
          <div class="row"><div class="label">Amount:</div><div class="value">${formatCurrency(trans.amount)}</div></div>
          <div class="row"><div class="label">Payment Method:</div><div class="value">${trans.payment_method.toUpperCase()}</div></div>
        </div>
        
        <div class="section">
          <h3>Bank Details</h3>
          <div class="row"><div class="label">Bank:</div><div class="value">${bank_details.bank_name}</div></div>
          <div class="row"><div class="label">Account Name:</div><div class="value">${bank_details.account_name}</div></div>
          <div class="row"><div class="label">Account Number:</div><div class="value">${bank_details.account_number}</div></div>
          ${bank_details.branch ? `<div class="row"><div class="label">Branch:</div><div class="value">${bank_details.branch}</div></div>` : ''}
        </div>
        
        <div class="section">
          <h3>Customer Information</h3>
          <div class="row"><div class="label">Name:</div><div class="value">${customer.name}</div></div>
          ${customer.phone ? `<div class="row"><div class="label">Phone:</div><div class="value">${customer.phone}</div></div>` : ''}
          ${customer.email ? `<div class="row"><div class="label">Email:</div><div class="value">${customer.email}</div></div>` : ''}
        </div>
        
        <div class="section">
          <h3>Items Purchased</h3>
          <table>
            <thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              ${sale.items.map(item => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row"><td colspan="3" align="right">Subtotal:</td><td>${formatCurrency(sale.subtotal)}</td></tr>
              ${sale.discount > 0 ? `<tr><td colspan="3" align="right">Discount:</td><td>-${formatCurrency(sale.discount)}</td></tr>` : ''}
              <tr class="total-row"><td colspan="3" align="right"><strong>Total:</strong></td><td><strong>${formatCurrency(sale.total)}</strong></td></tr>
            </tfoot>
          </table>
        </div>
        
        ${sale.notes ? `<div class="section"><h3>Notes</h3><p>${sale.notes}</p></div>` : ''}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Transaction Details</h2>
          <div className="flex gap-2">
            <button
              onClick={printTransaction}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Print"
            >
              <FiPrinter size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Transaction Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-2">Transaction Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Invoice Number</p>
              <p className="font-mono font-medium">{sale.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">{formatDate(sale.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reference Number</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm">{trans.reference}</p>
                <button
                  onClick={() => copyToClipboard(trans.reference, 'Reference number')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiCopy size={14} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(trans.amount)}</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-2 text-blue-700">Bank Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Bank Name</p>
              <p className="font-medium">{bank_details.bank_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Name</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">{bank_details.account_name}</p>
                <button
                  onClick={() => copyToClipboard(bank_details.account_name, 'Account name')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiCopy size={14} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <div className="flex items-center gap-2">
                <p className="font-mono font-medium">{bank_details.account_number}</p>
                <button
                  onClick={() => copyToClipboard(bank_details.account_number, 'Account number')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiCopy size={14} />
                </button>
              </div>
            </div>
            {bank_details.branch && (
              <div>
                <p className="text-sm text-gray-500">Branch</p>
                <p className="font-medium">{bank_details.branch}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-2">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{customer.name}</p>
            </div>
            {customer.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p>{customer.phone}</p>
              </div>
            )}
            {customer.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p>{customer.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Items Purchased</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm">Product</th>
                  <th className="px-4 py-2 text-right text-sm">Quantity</th>
                  <th className="px-4 py-2 text-right text-sm">Price</th>
                  <th className="px-4 py-2 text-right text-sm">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sale.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{item.product.name}</td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="px-4 py-2 text-right font-medium">Subtotal:</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(sale.subtotal)}</td>
                </tr>
                {sale.discount > 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-2 text-right font-medium text-red-600">Discount:</td>
                    <td className="px-4 py-2 text-right text-red-600">-{formatCurrency(sale.discount)}</td>
                  </tr>
                )}
                <tr className="font-bold">
                  <td colSpan="3" className="px-4 py-2 text-right">Total:</td>
                  <td className="px-4 py-2 text-right text-green-600">{formatCurrency(sale.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold mb-1">Notes</h3>
            <p className="text-sm">{sale.notes}</p>
          </div>
        )}

        {/* Deposit Slip */}
        {trans.deposit_slip && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Deposit Slip</h3>
            <a
              href={`/storage/${trans.deposit_slip}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <FiDownload /> View Deposit Slip
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankTransactionDetails;