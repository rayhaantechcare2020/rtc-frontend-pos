import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiPrinter, 
  FiDownload,
  FiPackage,
  FiTruck,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiX
} from 'react-icons/fi';
import { directReceiveService } from '../../services/directReceive';
import { companyService } from '../../services/company';
import toast from 'react-hot-toast';

const DirectReceiveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [receive, setReceive] = useState(null);
  const [printerSettings, setPrinterSettings] = useState({
    default_printer_type: 'thermal',
    print_copies: 1
  });

  useEffect(() => {
    fetchDetails();
    fetchPrinterSettings();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await directReceiveService.getById(id);
      if (response.success) {
        setReceive(response.data);
      }
    } catch (error) {
      console.error('Error fetching direct receive:', error);
      toast.error('Failed to load receive details');
      navigate('/direct-receive/history');
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

  const printReceipt = async () => {
    try {
      setPrinting(true);
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${baseUrl}/direct-receives/${id}/print?type=${printerSettings.default_printer_type}&token=${token}`;
      
      const printWindow = window.open(url, '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast.error('Please allow popups to print');
      }
    } catch (error) {
      console.error('Error printing:', error);
      toast.error('Failed to print');
    } finally {
      setPrinting(false);
    }
  };

  const formatCurrency = (value) => {
    return `₦${Number(value).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800'
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

  if (!receive) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Receive record not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/direct-receive/history"
            className="text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold">Receive Details</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(receive.payment_status)}`}>
            {receive.payment_status}
          </span>
        </div>
        
        <button
          onClick={printReceipt}
          disabled={printing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPrinter /> {printing ? 'Printing...' : 'Print Receipt'}
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiPackage /> Items Received
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {receive.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.product?.name || item.product_name}</div>
                        {item.product?.sku && (
                          <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unit_cost)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right">Subtotal:</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(receive.subtotal)}</td>
                  </tr>
                  <tr className="text-lg font-bold">
                    <td colSpan="3" className="px-4 py-3 text-right">Total:</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(receive.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Vendor Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiUser /> Vendor Information
            </h2>
            <div className="space-y-2">
              <p className="font-medium">{receive.vendor_name || receive.vendor?.name}</p>
              {receive.vendor_phone && (
                <p className="text-sm text-gray-600">📞 {receive.vendor_phone}</p>
              )}
            </div>
          </div>

          {/* Tracking Info */}
          {(receive.waybill_number || receive.truck_number || receive.driver_name) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FiTruck /> Tracking Information
              </h2>
              <div className="space-y-2 text-sm">
                {receive.waybill_number && (
                  <p><span className="text-gray-500">Waybill:</span> {receive.waybill_number}</p>
                )}
                {receive.truck_number && (
                  <p><span className="text-gray-500">Truck:</span> {receive.truck_number}</p>
                )}
                {receive.driver_name && (
                  <p><span className="text-gray-500">Driver:</span> {receive.driver_name}</p>
                )}
                {receive.driver_phone && (
                  <p><span className="text-gray-500">Driver Phone:</span> {receive.driver_phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiCreditCard /> Payment Information
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(receive.payment_status)}`}>
                  {receive.payment_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Method:</span>
                <span className="capitalize">{receive.payment_method || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{new Date(receive.receive_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference:</span>
                <span className="font-mono text-sm">{receive.reference_number}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {receive.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-2">Notes</h2>
              <p className="text-gray-600">{receive.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectReceiveDetail;