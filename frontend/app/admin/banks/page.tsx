'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, apiRequest } from '../../../lib/api';

interface Bank {
  id: string;
  name: string;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BanksPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankLogo, setBankLogo] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in and is an admin
    const token = getToken();
    if (!token) {
      console.log('No token found, redirecting to login');
      router.push('/login');
      return;
    }
    
    // Decode token to check role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', { role: payload.role });
      
      if (payload.role !== 'ADMIN') {
        console.log('User is not an admin, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }
      
      // Fetch banks
      fetchBanks();
      
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router]);
  
  const fetchBanks = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log('Fetching banks...');
      const data = await apiRequest('/api/banks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Fetched banks:', data);
      
      setBanks(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error('Error fetching banks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load banks');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddBank = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      if (!bankName.trim()) {
        throw new Error('Bank name is required');
      }
      
      const data = await apiRequest('/api/banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: bankName.trim(),
          logo: bankLogo.trim() || null,
        }),
      });
      
      setBanks([...banks, data]);
      setBankName('');
      setShowForm(false);
      setFormSuccess('Bank added successfully!');
      
      // Hide form after successful submission
      setTimeout(() => {
        setFormSuccess('');
      }, 2000);
      
    } catch (err) {
      console.error('Error adding bank:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to add bank');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteBank = async (bankId: string) => {
    if (!confirm('Are you sure you want to delete this bank? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await apiRequest(`/api/banks/${bankId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh banks list
      fetchBanks();
      
    } catch (err) {
      console.error('Error deleting bank:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete bank');
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banks Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {showForm ? 'Cancel' : 'Add New Bank'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {showForm && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Bank</h2>
          <form onSubmit={handleAddBank}>
            <div className="mb-4">
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="Enter bank name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="bankLogo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logo URL
              </label>
              <input
                type="text"
                id="bankLogo"
                value={bankLogo}
                onChange={(e) => setBankLogo(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="Enter logo URL (optional)"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter a URL to the bank's logo image (optional)
              </p>
            </div>
            
            {formError && (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400">{formError}</div>
            )}
            
            {formSuccess && (
              <div className="mb-4 text-sm text-green-600 dark:text-green-400">{formSuccess}</div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
              >
                {formLoading ? 'Adding...' : 'Add Bank'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {banks.map((bank) => (
            <li key={bank.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {bank.logo && (
                    <img
                      src={bank.logo}
                      alt={`${bank.name} logo`}
                      className="h-10 w-10 object-contain mr-4"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{bank.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Added on {new Date(bank.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBank(bank.id)}
                  className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
          {banks.length === 0 && (
            <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
              No banks found. Add your first bank using the button above.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
} 