// components/HoldSalesModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiClock, 
  FiRefreshCw, 
  FiTrash2, 
  FiShoppingCart,
  FiAlertCircle
} from 'react-icons/fi';
import { holdSaleService } from '../services/holdSaleService';
import toast from 'react-hot-toast';

const HoldSalesModal = ({ onClose, onRestore }) => {
  const [heldSales, setHeldSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchHeldSales();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHeldSales, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHeldSales = async () => {
    try {
      setLoading(true);
      const response = await holdSaleService.getHeldSales();
      if (response.success) {
        setHeldSales(response.data);
      }
    } catch (error) {
      console.error('Error fetching held sales:', error);
      toast.error('Failed to load held sales');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (holdSale) => {
    setProcessing(holdSale.hold_reference);
    try {
      const response = await holdSaleService.restoreHeldSale(holdSale.hold_reference);
      if (response.success) {
        toast.success('Sale restored successfully');
        onRestore(response.data);
        onClose();
      } else if (response.expired) {
        toast.error('This held sale has expired');
        fetchHeldSales();
      }
    } catch (error) {
      console.error('Error restoring sale:', error);
      toast.error('Failed to restore sale');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (holdSale) => {
    if (window.confirm(`Delete held sale ${holdSale.hold_reference}? This action cannot be undone.`)) {
      try {
        const response = await holdSaleService.deleteHeldSale(holdSale.hold_reference);
        if (response.success) {
          toast.success('Held sale deleted');
          fetchHeldSales();
        }
      } catch (error) {
        toast.error('Failed to delete held sale');
      }
    }
  };

  const formatTimeRemaining = (expiresAt) => {
    if (!expiresAt) return 'No expiry';
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatCurrency = (amount) => {
    return `₦${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FiClock /> Held Sales
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : heldSales.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiClock className="mx-auto text-4xl mb-2" />
            <p>No held sales found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {heldSales.map((hold) => (
              <div
                key={hold.id}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {hold.hold_reference}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(hold.held_at)}
                      </span>
                      {hold.expires_at && new Date(hold.expires_at) <= new Date() && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          Expired
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Customer:</span>
                        <p className="font-medium">{hold.customer_name || 'Walk-in'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Items:</span>
                        <p className="font-medium">{hold.cart_items?.items?.length || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <p className="font-bold text-green-600">{formatCurrency(hold.total)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Time Remaining:</span>
                        <p className={`font-medium flex items-center gap-1 ${
                          hold.expires_at && new Date(hold.expires_at) <= new Date()
                            ? 'text-red-600'
                            : 'text-orange-600'
                        }`}>
                          <FiClock size={12} />
                          {formatTimeRemaining(hold.expires_at)}
                        </p>
                      </div>
                    </div>
                    
                    {hold.notes && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="text-gray-400">Notes:</span> {hold.notes}
                      </div>
                    )}
                    
                    {hold.cart_items?.items?.length > 0 && (
                      <div className="mt-2 text-xs text-gray-400">
                        Items: {hold.cart_items.items.map(i => i.name).join(', ').substring(0, 100)}
                        {hold.cart_items.items.join(', ').length > 100 ? '...' : ''}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleRestore(hold)}
                      disabled={processing === hold.hold_reference || (hold.expires_at && new Date(hold.expires_at) <= new Date())}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                      title="Restore Sale"
                    >
                      {processing === hold.hold_reference ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                      ) : (
                        <FiRefreshCw size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(hold)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HoldSalesModal;