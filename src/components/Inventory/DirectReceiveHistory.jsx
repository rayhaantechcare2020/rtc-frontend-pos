import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiX, FiDownload, FiCalendar, FiSearch, FiPrinter } from 'react-icons/fi';
import { directReceiveService } from '../../services/directReceive';
import toast from 'react-hot-toast';

const DirectReceiveHistory = () => {
  const [receives, setReceives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedReceive, setSelectedReceive] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    fetchReceives();
  }, []);

  const fetchReceives = async () => {
    try {
      setLoading(true);
      const response = await directReceiveService.getAll();
      
      let receivesData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          receivesData = response.data;
        } else if (response.data.data) {
          receivesData = response.data.data;
        }
      }
      
      setReceives(receivesData);
    } catch (error) {
      console.error('Error fetching receives:', error);
      toast.error('Failed to load receive history');
    } finally {
      setLoading(false);
    }
  };

  const filteredReceives = receives.filter(receive => {
    const matchesSearch = 
      receive.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
      receive.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      receive.waybill_number?.toLowerCase().includes(search.toLowerCase());
    
    const matchesDate = dateFilter ? receive.receive_date === dateFilter : true;
    
    return matchesSearch && matchesDate;
  });

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleViewDetails = (receive) => {
    setSelectedReceive(receive);
    setShowDetails(true);
  };

  const handlePrint = (receive) => {
    // Store the receive to print
    setSelectedReceive(receive);
    // Wait for state to update and modal to render
    setTimeout(() => {
      const printContent = printRef.current;
      if (printContent) {
        const originalTitle = document.title;
        document.title = `Receive_${receive.reference_number}`;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receive ${receive.reference_number}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  padding: 20px;
                }
                .print-header {
                  text-align: center;
                  margin-bottom: 30px;
                  border-bottom: 2px solid #333;
                  padding-bottom: 10px;
                }
                .print-header h1 {
                  margin: 0;
                  color: #333;
                }
                .print-header p {
                  margin: 5px 0;
                  color: #666;
                }
                .info-section {
                  margin-bottom: 20px;
                  padding: 15px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 10px;
                }
                .info-item {
                  margin-bottom: 10px;
                }
                .info-label {
                  font-weight: bold;
                  color: #555;
                  margin-bottom: 5px;
                }
                .info-value {
                  color: #333;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 10px;
                  text-align: left;
                }
                th {
                  background-color: #f5f5f5;
                  font-weight: bold;
                }
                .text-right {
                  text-align: right;
                }
                .total-row {
                  font-weight: bold;
                  background-color: #f5f5f5;
                }
                .status-badge {
                  display: inline-block;
                  padding: 3px 8px;
                  border-radius: 3px;
                  font-size: 12px;
                  font-weight: bold;
                }
                .status-pending {
                  background-color: #fff3cd;
                  color: #856404;
                }
                .status-paid {
                  background-color: #d4edda;
                  color: #155724;
                }
                .status-partial {
                  background-color: #cce5ff;
                  color: #004085;
                }
                .notes-section {
                  margin-top: 20px;
                  padding: 15px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                  background-color: #f9f9f9;
                }
                .footer {
                  margin-top: 30px;
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                  border-top: 1px solid #ddd;
                  padding-top: 10px;
                }
                @media print {
                  body {
                    margin: 0;
                    padding: 10px;
                  }
                  .no-print {
                    display: none;
                  }
                }
              </style>
            </head>
            <body>
              <div class="print-header">
                <h1>Direct Receive Report</h1>
                <p>Generated on ${new Date().toLocaleString()}</p>
              </div>
              
              <div class="info-section">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Reference Number</div>
                    <div class="info-value">${receive.reference_number || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Receive Date</div>
                    <div class="info-value">${receive.receive_date ? new Date(receive.receive_date).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Vendor</div>
                    <div class="info-value">${receive.vendor_name || receive.vendor?.name || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Payment Status</div>
                    <div class="info-value">
                      <span class="status-badge status-${receive.payment_status || 'pending'}">
                        ${receive.payment_status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              ${(receive.waybill_number || receive.truck_number) ? `
                <div class="info-section">
                  <h3>Tracking Information</h3>
                  <div class="info-grid">
                    ${receive.waybill_number ? `
                      <div class="info-item">
                        <div class="info-label">Waybill Number</div>
                        <div class="info-value">${receive.waybill_number}</div>
                      </div>
                    ` : ''}
                    ${receive.truck_number ? `
                      <div class="info-item">
                        <div class="info-label">Truck Number</div>
                        <div class="info-value">${receive.truck_number}</div>
                      </div>
                    ` : ''}
                    ${receive.driver_name ? `
                      <div class="info-item">
                        <div class="info-label">Driver Name</div>
                        <div class="info-value">${receive.driver_name}</div>
                      </div>
                    ` : ''}
                    ${receive.driver_phone ? `
                      <div class="info-item">
                        <div class="info-label">Driver Phone</div>
                        <div class="info-value">${receive.driver_phone}</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}

              <h3>Items Received</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Unit Cost</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${receive.items?.map(item => `
                    <tr>
                      <td>${item.product?.name || item.product_name || 'N/A'}</td>
                      <td class="text-right">${item.quantity || 0}</td>
                      <td class="text-right">₦${Number(item.unit_cost || 0).toLocaleString()}</td>
                      <td class="text-right">₦${Number(item.total || 0).toLocaleString()}</td>
                    </tr>
                  `).join('') || `
                    <tr>
                      <td colspan="4" class="text-center">No items found</td>
                    </tr>
                  `}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="3" class="text-right"><strong>Total:</strong></td>
                    <td class="text-right"><strong>₦${Number(receive.total || 0).toLocaleString()}</strong></td>
                  </tr>
                </tfoot>
              </table>

              ${receive.notes ? `
                <div class="notes-section">
                  <strong>Notes:</strong>
                  <p>${receive.notes}</p>
                </div>
              ` : ''}

              <div class="footer">
                <p>This is a computer-generated document. No signature required.</p>
              </div>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        
        document.title = originalTitle;
      }
    }, 100);
  };

  const handlePrintTable = () => {
    const printContent = document.getElementById('receives-table');
    if (printContent) {
      const originalTitle = document.title;
      document.title = 'Direct_Receive_History';
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Direct Receive History</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                padding: 20px;
              }
              .print-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
              }
              .print-header h1 {
                margin: 0;
                color: #333;
              }
              .print-header p {
                margin: 5px 0;
                color: #666;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
              }
              th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              .text-right {
                text-align: right;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 10px;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 10px;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>Direct Receive History Report</h1>
              <p>Generated on ${new Date().toLocaleString()}</p>
              ${search ? `<p>Search Filter: "${search}"</p>` : ''}
              ${dateFilter ? `<p>Date Filter: ${dateFilter}</p>` : ''}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Vendor</th>
                  <th class="text-right">Items</th>
                  <th class="text-right">Total</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                ${filteredReceives.map(receive => `
                  <tr>
                    <td>${receive.receive_date ? new Date(receive.receive_date).toLocaleDateString() : 'N/A'}</td>
                    <td>${receive.reference_number || 'N/A'}</td>
                    <td>${receive.vendor_name || receive.vendor?.name || 'N/A'}</td>
                    <td class="text-right">${receive.items?.length || 0}</td>
                    <td class="text-right">₦${Number(receive.total || 0).toLocaleString()}</td>
                    <td>${receive.payment_status || 'Pending'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Total Records: ${filteredReceives.length}</p>
              <p>This is a computer-generated document. No signature required.</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      
      document.title = originalTitle;
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
        <h1 className="text-2xl font-bold">Direct Receive History</h1>
        <div className="flex space-x-3">
          {filteredReceives.length > 0 && (
            <button
              onClick={handlePrintTable}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center"
            >
              <FiPrinter className="mr-2" />
              Print List
            </button>
          )}
          <Link
            to="/direct-receive"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            New Receive
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference, vendor, waybill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-3 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Receives Table */}
      <div id="receives-table" className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredReceives.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No receive records found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReceives.map((receive) => (
                <tr key={receive.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    {new Date(receive.receive_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {receive.reference_number}
                  </td>
                  <td className="px-6 py-4">
                    {receive.vendor_name || receive.vendor?.name}
                  </td>
                  <td className="px-6 py-4">
                    {receive.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 font-medium">
                    ₦{Number(receive.total).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(receive.payment_status)}`}>
                      {receive.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewDetails(receive)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                    <button
                      onClick={() => handlePrint(receive)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Print"
                    >
                      <FiPrinter />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal with Print Button */}
      {showDetails && selectedReceive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Receive Details</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePrint(selectedReceive)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  title="Print"
                >
                  <FiPrinter size={20} />
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            {/* Hidden print template */}
            <div ref={printRef} style={{ display: 'none' }}>
              {/* This div will contain the print content */}
            </div>

            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-mono font-medium">{selectedReceive.reference_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p>{new Date(selectedReceive.receive_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vendor</p>
                  <p>{selectedReceive.vendor_name || selectedReceive.vendor?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(selectedReceive.payment_status)}`}>
                    {selectedReceive.payment_status}
                  </span>
                </div>
              </div>

              {/* Tracking Info */}
              {(selectedReceive.waybill_number || selectedReceive.truck_number) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Tracking Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedReceive.waybill_number && (
                      <>
                        <span className="text-gray-500">Waybill:</span>
                        <span>{selectedReceive.waybill_number}</span>
                      </>
                    )}
                    {selectedReceive.truck_number && (
                      <>
                        <span className="text-gray-500">Truck:</span>
                        <span>{selectedReceive.truck_number}</span>
                      </>
                    )}
                    {selectedReceive.driver_name && (
                      <>
                        <span className="text-gray-500">Driver:</span>
                        <span>{selectedReceive.driver_name}</span>
                      </>
                    )}
                    {selectedReceive.driver_phone && (
                      <>
                        <span className="text-gray-500">Driver Phone:</span>
                        <span>{selectedReceive.driver_phone}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-2">Items Received</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-right">Quantity</th>
                      <th className="px-4 py-2 text-right">Unit Cost</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceive.items?.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.product?.name || item.product_name}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">₦{Number(item.unit_cost).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-medium">₦{Number(item.total).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-right">Total:</td>
                      <td className="px-4 py-2 text-right">₦{Number(selectedReceive.total).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes */}
              {selectedReceive.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Notes:</p>
                  <p>{selectedReceive.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectReceiveHistory;