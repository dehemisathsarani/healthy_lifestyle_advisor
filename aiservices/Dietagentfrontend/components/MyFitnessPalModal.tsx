import React, { useState } from 'react';
import { apiClient, MFPCredentials } from '../api';

interface MyFitnessPalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function MyFitnessPalModal({ isOpen, onClose, onSuccess }: MyFitnessPalModalProps) {
  const [credentials, setCredentials] = useState<MFPCredentials>({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Call the API to import data
      const result = await apiClient.importFromMyFitnessPal(credentials);
      setImportResult(result);
      
      // Notify parent of successful import
      if (result.success) {
        onSuccess();
      } else {
        setError('Import failed: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to import data. Please check your credentials and try again.');
      console.error('MyFitnessPal import error:', err);
    } finally {
      setLoading(false);
    }
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Import from MyFitnessPal
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
          
          {/* Success Message */}
          {importResult?.success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
              <p>Successfully imported data!</p>
              <p className="text-sm mt-1">
                Imported {importResult.imported_days} days with {importResult.imported_meals} meals.
              </p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {/* Import Form */}
          {!importResult?.success && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="username">
                  MyFitnessPal Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={credentials.username}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                  MyFitnessPal Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your credentials are only used for this import and are not stored.
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 mr-2"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Importing...' : 'Import Data'}
                </button>
              </div>
            </form>
          )}
          
          {/* Close Button (for after successful import) */}
          {importResult?.success && (
            <div className="flex justify-end mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          )}
          
          {/* Additional Information */}
          <div className="mt-6 pt-4 border-t text-xs text-gray-500">
            <p>
              This will import your nutrition data from MyFitnessPal, including meals and nutrients.
            </p>
            <p className="mt-1">
              Note: MyFitnessPal API access is limited and may require premium account access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyFitnessPalModal;
