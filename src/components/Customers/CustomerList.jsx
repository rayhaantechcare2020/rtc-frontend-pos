import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiDollarSign,
  FiToggleLeft,
  FiToggleRight,
  FiEye,
  FiX,
  FiDownload
} from 'react-icons/fi';
import { customerService } from '../../services/customer';
import { exportToExcel, formatCustomersData } from '../../utils/excelExport';
import toast from 'react-hot-toast';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBalance, setFilterBalance] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15
  });

  useEffect(() => {
    fetchCustomers();
  }, [pagination.current_page, filterStatus, filterBalance]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current_page,
        per_page: pagination.per_page,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        has_balance: filterBalance === 'with_balance' ? true : 
                    filterBalance === 'no_balance' ? false : undefined,
        search: search || undefined
      };
      
      const response = await customerService.getCustomers(params);
      
      if (response.success) {
        setCustomers(response.data.data || []);
        setPagination({
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          total: response.data.total || 0,
          per_page: response.data.per_page || 15
        });
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  //Export customers to Excel
  const handleExportExcel = () => {
  const dataToExport = filteredCustomers.length > 0 ? filteredCustomers : customers;
  if (dataToExport.length === 0) {
    toast.error('No data to export');
    return;
  }
  const exportData = formatCustomersData(dataToExport, formatCurrency);
  const success = exportToExcel(exportData, 'customers', 'Customers');
  if (success) toast.success(`Exported ${exportData.length} customers`);
};

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchCustomers();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      await customerService.deleteCustomer(id);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  const formatCurrency = (value) => {
    return `₦${Number(value).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const getBalanceClass = (balance, limit) => {
    if (balance === 0) return 'text-gray-600';
    if (limit && balance > limit) return 'text-red-600 font-bold';
    return 'text-orange-600';
  };

  if (loading && customers.length === 0) {
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
        <h1 className="text-2xl font-bold">Customers</h1>
        <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
                  <FiDownload /> Export Excel
                  </button>
        <Link
          to="/customers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <FiPlus /> Add Customer
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPagination(prev => ({ ...prev, current_page: 1 }));
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Balance Filter */}
          <select
            value={filterBalance}
            onChange={(e) => {
              setFilterBalance(e.target.value);
              setPagination(prev => ({ ...prev, current_page: 1 }));
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Balances</option>
            <option value="with_balance">With Balance</option>
            <option value="no_balance">No Balance</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchCustomers}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <FiUser className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 mt-4">No customers found</p>
            {search && (
              <p className="text-sm text-gray-400 mt-2">Try adjusting your search</p>
            )}
            {!search && (
              <Link
                to="/customers/new"
                className="inline-block mt-4 text-blue-600 hover:text-blue-700"
              >
                Add your first customer
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit Limit</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="font-medium">{customer.name}</div>
                        {customer.tax_number && (
                          <div className="text-xs text-gray-500">Tax: {customer.tax_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <FiMail className="text-gray-400" size={14} />
                              <span>{customer.email}</span>
                            </div>
                          )}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm mt-1">
                            <FiPhone className="text-gray-400" size={14} />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={getBalanceClass(customer.current_balance, customer.credit_limit)}>
                          {formatCurrency(customer.current_balance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {customer.credit_limit ? formatCurrency(customer.credit_limit) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(customer.status)}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewDetails(customer)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        <Link
                          to={`/customers/${customer.id}`}
                          className="text-blue-600 hover:text-blue-800 mr-3 inline-block"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </Link>
                        <button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FiTrash2 />
                          <Link
                            to={`/customers/${customer.id}/payments`}
                              className="text-green-600 hover:text-green-800"
                              title="View Payments"
                                >
                                <FiDollarSign />
                          </Link>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} customers
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                    disabled={pagination.current_page === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {pagination.current_page} of {pagination.last_page}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Details Modal */}
      {showDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Customer Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(selectedCustomer.status)}`}>
                    {selectedCustomer.status}
                  </span>
                </div>
                {selectedCustomer.email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{selectedCustomer.email}</p>
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{selectedCustomer.phone}</p>
                  </div>
                )}
                {selectedCustomer.tax_number && (
                  <div>
                    <p className="text-sm text-gray-500">Tax Number</p>
                    <p>{selectedCustomer.tax_number}</p>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p>{selectedCustomer.address}</p>
                  </div>
                )}
              </div>

              {/* Financial Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p className={`text-xl font-bold ${getBalanceClass(selectedCustomer.current_balance, selectedCustomer.credit_limit)}`}>
                    {formatCurrency(selectedCustomer.current_balance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credit Limit</p>
                  <p className="text-xl font-bold">
                    {selectedCustomer.credit_limit ? formatCurrency(selectedCustomer.credit_limit) : 'No limit'}
                  </p>
                </div>
              </div>

              {/* Recent Sales */}
              {selectedCustomer.sales && selectedCustomer.sales.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Recent Purchases</h3>
                  <div className="space-y-2">
                    {selectedCustomer.sales.map((sale) => (
                      <div key={sale.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">{sale.invoice_number}</p>
                          <p className="text-sm text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className="font-bold text-green-600">{formatCurrency(sale.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedCustomer.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p>{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;