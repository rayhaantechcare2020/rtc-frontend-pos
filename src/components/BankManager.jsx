// components/BankManager.js
import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const BankManager = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    account_name: '',
    account_number: '',
    bank_code: '',
    branch: '',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/banks');
      setBanks(response.data.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
      toast.error('Failed to load banks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBank) {
        await api.put(`/banks/${editingBank.id}`, formData);
        toast.success('Bank updated successfully');
      } else {
        await api.post('/banks', formData);
        toast.success('Bank added successfully');
      }
      resetForm();
      fetchBanks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (bank) => {
    if (window.confirm(`Delete ${bank.name}? This action cannot be undone.`)) {
      try {
        await api.delete(`/banks/${bank.id}`);
        toast.success('Bank deleted successfully');
        fetchBanks();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      account_name: '',
      account_number: '',
      bank_code: '',
      branch: '',
      sort_order: 0,
      is_active: true
    });
    setEditingBank(null);
    setShowForm(false);
  };

  const editBank = (bank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      account_name: bank.account_name,
      account_number: bank.account_number,
      bank_code: bank.bank_code || '',
      branch: bank.branch || '',
      sort_order: bank.sort_order || 0,
      is_active: bank.is_active
    });
    setShowForm(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Bank Accounts</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <FiPlus className="mr-2" /> Add Bank
        </button>
      </div>

      {/* Bank Form */}
      {showForm && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingBank ? 'Edit Bank' : 'Add New Bank'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Name *</label>
              <input
                type="text"
                value={formData.account_name}
                onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Number *</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Code</label>
              <input
                type="text"
                value={formData.bank_code}
                onChange={(e) => setFormData({...formData, bank_code: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({...formData, branch: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingBank ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banks.map((bank) => (
          <div key={bank.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{bank.name}</h3>
              <div className="flex space-x-2">
                <button onClick={() => editBank(bank)} className="text-blue-600 hover:text-blue-800">
                  <FiEdit />
                </button>
                <button onClick={() => handleDelete(bank)} className="text-red-600 hover:text-red-800">
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Account:</span> {bank.account_name}</p>
              <p><span className="text-gray-500">Number:</span> {bank.account_number}</p>
              {bank.branch && <p><span className="text-gray-500">Branch:</span> {bank.branch}</p>}
              <p className="flex items-center">
                <span className="text-gray-500 mr-2">Status:</span>
                {bank.is_active ? (
                  <span className="text-green-600 flex items-center"><FiCheck className="mr-1" /> Active</span>
                ) : (
                  <span className="text-red-600 flex items-center"><FiX className="mr-1" /> Inactive</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BankManager;