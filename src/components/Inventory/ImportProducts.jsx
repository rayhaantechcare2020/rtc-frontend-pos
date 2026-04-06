import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUpload, 
  FiDownload, 
  FiX, 
  FiCheckCircle, 
  FiAlertCircle,
  FiFileText,
  FiTrash2
} from 'react-icons/fi';
import { importService } from '../../services/import';
import toast from 'react-hot-toast';

const ImportProducts = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('append');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const isValidType = validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv');
      
      if (!isValidType) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      setResult(null);
      setErrors([]);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const blob = await importService.downloadTemplate();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_import_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    try {
      const response = await importService.importProducts(formData);
      if (response.success) {
        setResult(response.data);
        setErrors(response.data.errors || []);
        toast.success(response.message);
        
        // Refresh product list after 2 seconds
        setTimeout(() => {
          navigate('/products');
        }, 2000);
      }
    } catch (error) {
      console.error('Error importing products:', error);
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setErrors([]);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Import Products</h1>
        <button
          onClick={() => navigate('/products')}
          className="text-gray-600 hover:text-gray-800"
        >
          <FiX size={24} />
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">Import Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Download the template file using the button below</li>
          <li>• Fill in your product data in the template</li>
          <li>• Keep the column headers exactly as provided</li>
          <li>• Required fields: name</li>
          <li>• Optional fields: sku, price, cost, stock, category, vendor, description</li>
          <li>• For SKU, ensure uniqueness across products</li>
          <li>• Maximum file size: 5MB</li>
        </ul>
      </div>

      {/* Download Template */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Download Template</h2>
            <p className="text-sm text-gray-500">Get the CSV template with correct headers</p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              <>
                <FiDownload /> Download Template
              </>
            )}
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload File</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          {!file ? (
            <div>
              <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Click or drag file to upload</p>
              <p className="text-sm text-gray-500">CSV or Excel files only (max 5MB)</p>
              <input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
              >
                Choose File
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <FiFileText className="text-blue-600 text-2xl" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="text-red-600 hover:text-red-800"
              >
                <FiTrash2 />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Import Mode */}
      {file && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Import Mode</h2>
          <div className="grid grid-cols-3 gap-4">
            <label className={`border rounded-lg p-4 cursor-pointer transition ${
              mode === 'append' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}>
              <input
                type="radio"
                name="mode"
                value="append"
                checked={mode === 'append'}
                onChange={(e) => setMode(e.target.value)}
                className="hidden"
              />
              <div>
                <h3 className="font-semibold mb-1">Append</h3>
                <p className="text-sm text-gray-500">Add new products, skip duplicates</p>
              </div>
            </label>
            <label className={`border rounded-lg p-4 cursor-pointer transition ${
              mode === 'update' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}>
              <input
                type="radio"
                name="mode"
                value="update"
                checked={mode === 'update'}
                onChange={(e) => setMode(e.target.value)}
                className="hidden"
              />
              <div>
                <h3 className="font-semibold mb-1">Update</h3>
                <p className="text-sm text-gray-500">Update existing products, add new ones</p>
              </div>
            </label>
            <label className={`border rounded-lg p-4 cursor-pointer transition ${
              mode === 'replace' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}>
              <input
                type="radio"
                name="mode"
                value="replace"
                checked={mode === 'replace'}
                onChange={(e) => setMode(e.target.value)}
                className="hidden"
              />
              <div>
                <h3 className="font-semibold mb-1">Replace</h3>
                <p className="text-sm text-gray-500">Replace all existing products</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Import Button */}
      {file && (
        <div className="flex justify-end gap-4 mb-6">
          <button
            onClick={clearFile}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={uploading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Importing...
              </>
            ) : (
              <>
                <FiUpload /> Import Products
              </>
            )}
          </button>
        </div>
      )}

      {/* Import Results */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Import Results</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <FiCheckCircle className="mx-auto text-green-600 text-2xl mb-2" />
              <p className="text-2xl font-bold text-green-600">{result.imported || 0}</p>
              <p className="text-sm text-gray-600">Added</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <FiCheckCircle className="mx-auto text-blue-600 text-2xl mb-2" />
              <p className="text-2xl font-bold text-blue-600">{result.updated || 0}</p>
              <p className="text-sm text-gray-600">Updated</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <FiAlertCircle className="mx-auto text-yellow-600 text-2xl mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{result.skipped || 0}</p>
              <p className="text-sm text-gray-600">Skipped</p>
            </div>
          </div>
          
          {errors.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-red-600 mb-2">Errors:</h3>
              <div className="max-h-40 overflow-y-auto bg-red-50 p-3 rounded-lg">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600">• {error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportProducts;