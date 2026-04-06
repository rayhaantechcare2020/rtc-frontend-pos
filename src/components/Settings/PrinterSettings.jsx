import React, { useState, useEffect } from 'react';
import { FiSave, FiPrinter, FiSettings, FiZap, FiFileText } from 'react-icons/fi';
import { companyService } from '../../services/company';
import toast from 'react-hot-toast';

const PrinterSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    default_printer_type: 'thermal',
    thermal_width: '80mm',
    auto_print: true,
    print_copies: 1,
    paper_size: 'A4',
    print_logo: true,
    print_barcode: true
  });

  useEffect(() => {
    fetchPrinterSettings();
  }, []);

  const fetchPrinterSettings = async () => {
    try {
      setLoading(true);
      const response = await companyService.getPrinterSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching printer settings:', error);
      toast.error('Failed to load printer settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await companyService.updatePrinterSettings(settings);
      if (response.success) {
        toast.success('Printer settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving printer settings:', error);
      toast.error('Failed to save printer settings');
    } finally {
      setSaving(false);
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <FiPrinter /> Printer Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Printer Type */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Default Printer Type
          </label>
          <div className="grid grid-cols-3 gap-4">
            <label className={`border rounded-lg p-4 cursor-pointer transition ${
              settings.default_printer_type === 'thermal' 
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 hover:border-blue-300'
            }`}>
              <input
                type="radio"
                name="default_printer_type"
                value="thermal"
                checked={settings.default_printer_type === 'thermal'}
                onChange={handleChange}
                className="hidden"
              />
              <FiZap className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-center font-medium">Thermal</p>
              <p className="text-center text-xs text-gray-500">80mm/58mm</p>
            </label>

            <label className={`border rounded-lg p-4 cursor-pointer transition ${
              settings.default_printer_type === 'a4' 
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 hover:border-blue-300'
            }`}>
              <input
                type="radio"
                name="default_printer_type"
                value="a4"
                checked={settings.default_printer_type === 'a4'}
                onChange={handleChange}
                className="hidden"
              />
              <FiFileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-center font-medium">A4 Printer</p>
              <p className="text-center text-xs text-gray-500">Standard paper</p>
            </label>

            <label className={`border rounded-lg p-4 cursor-pointer transition ${
              settings.default_printer_type === 'both' 
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 hover:border-blue-300'
            }`}>
              <input
                type="radio"
                name="default_printer_type"
                value="both"
                checked={settings.default_printer_type === 'both'}
                onChange={handleChange}
                className="hidden"
              />
              <FiPrinter className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-center font-medium">Both</p>
              <p className="text-center text-xs text-gray-500">Ask each time</p>
            </label>
          </div>
        </div>

        {/* Thermal Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Thermal Printer Settings</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Paper Width</label>
              <select
                name="thermal_width"
                value={settings.thermal_width}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="58mm">58mm (2.28 inches)</option>
                <option value="80mm">80mm (3.15 inches)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Common for receipt printers</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Print Copies</label>
              <input
                type="number"
                name="print_copies"
                value={settings.print_copies}
                onChange={handleChange}
                min="1"
                max="5"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* A4 Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">A4 Printer Settings</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">Paper Size</label>
            <select
              name="paper_size"
              value={settings.paper_size}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="Letter">Letter</option>
            </select>
          </div>
        </div>

        {/* General Options */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Receipt Options</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="auto_print"
                checked={settings.auto_print}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Auto-print after sale</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="print_logo"
                checked={settings.print_logo}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Print company logo on receipt</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="print_barcode"
                checked={settings.print_barcode}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Print barcode on receipt</span>
            </label>
          </div>
        </div>

        {/* Test Print Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Test Print</h3>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => window.open('/api/pos/receipt/test?type=thermal', '_blank')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <FiZap /> Test Thermal
            </button>
            <button
              type="button"
              onClick={() => window.open('/api/pos/receipt/test?type=pdf', '_blank')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <FiFileText /> Test A4 PDF
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="border-t pt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FiSave /> {saving ? 'Saving...' : 'Save Printer Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrinterSettings;