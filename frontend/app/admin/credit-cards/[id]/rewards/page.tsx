'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, apiRequest } from '../../../../../lib/api';
import React from 'react';

// Types
interface Category {
  id: string;
  name: string;
  subCategories?: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

interface RewardRule {
  id: string;
  creditCardId: string;
  categoryId: string;
  category: Category;
  subCategoryId: string | null;
  subCategory: SubCategory | null;
  transactionType: 'ONLINE' | 'OFFLINE' | 'BOTH';
  rewardType: 'CASHBACK' | 'POINTS' | 'MILES';
  rewardValue: number;
  monthlyCap: number | null;
  minimumSpend: number | null;
}

interface CreditCard {
  id: string;
  name: string;
  bank: {
    id: string;
    name: string;
  };
  image: string | null;
  annualFee: number;
}

export default function CreditCardRewardsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const creditCardId = params.id;
  
  const [creditCard, setCreditCard] = useState<CreditCard | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    transactionType: 'BOTH',
    rewardType: 'CASHBACK',
    rewardValue: 0,
    monthlyCap: '',
    minimumSpend: '',
  });
  
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Add state for editing
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    transactionType: 'BOTH',
    rewardType: 'CASHBACK',
    rewardValue: 0,
    monthlyCap: '',
    minimumSpend: '',
  });
  const [editFormError, setEditFormError] = useState('');
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editSelectedCategory, setEditSelectedCategory] = useState<Category | null>(null);
  
  useEffect(() => {
    // Check if user is logged in and is an admin
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Decode token to check role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
      
      // Fetch data
      fetchData();
      
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router, creditCardId]);
  
  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Fetch credit card details
      const cardData = await apiRequest(`/api/credit-cards/${creditCardId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setCreditCard(cardData);
      
      // Fetch categories
      const categoriesData = await apiRequest('/api/transaction-categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setCategories(categoriesData);
      
      // Fetch reward rules for this credit card
      const rulesData = await apiRequest(`/api/reward-rules/credit-card/${creditCardId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setRewardRules(rulesData);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'categoryId') {
      const category = categories.find(cat => cat.id === value);
      setSelectedCategory(category || null);
      setFormData(prev => ({
        ...prev,
        categoryId: value,
        subCategoryId: '', // Reset subcategory when category changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Prepare data for API
      const rewardRuleData = {
        creditCardId,
        categoryId: formData.categoryId,
        subCategoryId: formData.subCategoryId || undefined,
        transactionType: formData.transactionType,
        rewardType: formData.rewardType,
        rewardValue: parseFloat(formData.rewardValue.toString()),
        monthlyCap: formData.monthlyCap ? parseFloat(formData.monthlyCap) : undefined,
        minimumSpend: formData.minimumSpend ? parseFloat(formData.minimumSpend) : undefined,
      };
      
      // Create reward rule
      await apiRequest('/api/reward-rules', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rewardRuleData),
      });
      
      // Reset form
      setFormData({
        categoryId: '',
        subCategoryId: '',
        transactionType: 'BOTH',
        rewardType: 'CASHBACK',
        rewardValue: 0,
        monthlyCap: '',
        minimumSpend: '',
      });
      
      // Refresh data
      fetchData();
      
    } catch (err) {
      console.error('Error creating reward rule:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to create reward rule');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this reward rule?')) {
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await apiRequest(`/api/reward-rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh data
      fetchData();
      
    } catch (err) {
      console.error('Error deleting reward rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete reward rule');
    }
  };
  
  const handleEditClick = (rule: RewardRule) => {
    setEditingRuleId(rule.id);
    setEditFormData({
      categoryId: rule.categoryId,
      subCategoryId: rule.subCategoryId || '',
      transactionType: rule.transactionType,
      rewardType: rule.rewardType,
      rewardValue: rule.rewardValue,
      monthlyCap: rule.monthlyCap ? rule.monthlyCap.toString() : '',
      minimumSpend: rule.minimumSpend ? rule.minimumSpend.toString() : '',
    });
    
    // Set the selected category for the edit form
    const category = categories.find(cat => cat.id === rule.categoryId);
    setEditSelectedCategory(category || null);
  };
  
  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setEditFormError('');
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'categoryId') {
      const category = categories.find(cat => cat.id === value);
      setEditSelectedCategory(category || null);
      setEditFormData(prev => ({
        ...prev,
        categoryId: value,
        subCategoryId: '', // Reset subcategory when category changes
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError('');
    setEditFormLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Prepare data for API
      const rewardRuleData = {
        creditCardId,
        categoryId: editFormData.categoryId,
        subCategoryId: editFormData.subCategoryId || undefined,
        transactionType: editFormData.transactionType,
        rewardType: editFormData.rewardType,
        rewardValue: parseFloat(editFormData.rewardValue.toString()),
        monthlyCap: editFormData.monthlyCap ? parseFloat(editFormData.monthlyCap) : undefined,
        minimumSpend: editFormData.minimumSpend ? parseFloat(editFormData.minimumSpend) : undefined,
      };
      
      // Update reward rule
      await apiRequest(`/api/reward-rules/${editingRuleId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rewardRuleData),
      });
      
      // Reset form and refresh data
      setEditingRuleId(null);
      fetchData();
      
    } catch (err) {
      console.error('Error updating reward rule:', err);
      setEditFormError(err instanceof Error ? err.message : 'Failed to update reward rule');
    } finally {
      setEditFormLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }
  
  if (error || !creditCard) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{error || 'Credit card not found'}</p>
            <Link href="/admin/credit-cards" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              &larr; Back to Credit Cards
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link href={`/admin/credit-cards/${creditCardId}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Card Details
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reward Rules - {creditCard.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {creditCard.bank.name}
          </p>
        </div>

        {/* Add New Rule Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Reward Rule</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {selectedCategory?.subCategories && selectedCategory.subCategories.length > 0 && (
                <div>
                  <label htmlFor="subCategoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sub-Category
                  </label>
                  <select
                    id="subCategoryId"
                    name="subCategoryId"
                    value={formData.subCategoryId}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="">All sub-categories</option>
                    {selectedCategory.subCategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="transactionType"
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  required
                >
                  <option value="BOTH">Both Online & Offline</option>
                  <option value="ONLINE">Online Only</option>
                  <option value="OFFLINE">Offline Only</option>
                </select>
              </div>

              <div>
                <label htmlFor="rewardType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reward Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="rewardType"
                  name="rewardType"
                  value={formData.rewardType}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  required
                >
                  <option value="CASHBACK">Cashback</option>
                  <option value="POINTS">Points</option>
                  <option value="MILES">Miles</option>
                </select>
              </div>

              <div>
                <label htmlFor="rewardValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reward Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="rewardValue"
                  name="rewardValue"
                  value={formData.rewardValue}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full px-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  required
                />
              </div>

              <div>
                <label htmlFor="monthlyCap" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Cap (₹)
                </label>
                <input
                  type="number"
                  id="monthlyCap"
                  name="monthlyCap"
                  value={formData.monthlyCap}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="Enter amount in ₹"
                  className="mt-1 block w-full px-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                />
              </div>

              <div>
                <label htmlFor="minimumSpend" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Spend (₹)
                </label>
                <input
                  type="number"
                  id="minimumSpend"
                  name="minimumSpend"
                  value={formData.minimumSpend}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="Enter amount in ₹"
                  className="mt-1 block w-full px-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                />
              </div>
            </div>

            {formError && (
              <div className="mt-4 text-sm text-red-600 dark:text-red-400">{formError}</div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {formLoading ? 'Adding...' : 'Add Rule'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Rules */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Existing Rules</h2>
          </div>
          
          {rewardRules.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No reward rules configured yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transaction Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reward
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Limits
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rewardRules.map(rule => (
                    <React.Fragment key={rule.id}>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {rule.category.name}
                          </div>
                          {rule.subCategory && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {rule.subCategory.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {rule.transactionType === 'BOTH' ? 'Online & Offline' :
                             rule.transactionType === 'ONLINE' ? 'Online Only' : 'Offline Only'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {rule.rewardType === 'CASHBACK' ? `${rule.rewardValue}% cashback` :
                             rule.rewardType === 'POINTS' ? `${rule.rewardValue} points per ₹1` :
                             `${rule.rewardValue} miles per ₹1`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {rule.minimumSpend && `Min: ₹${rule.minimumSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            {rule.minimumSpend && rule.monthlyCap && ' • '}
                            {rule.monthlyCap && `Cap: ₹${rule.monthlyCap.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            {!rule.minimumSpend && !rule.monthlyCap && 'No limits'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                          {editingRuleId === rule.id ? (
                            <div className="flex justify-end space-x-4">
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleEditSubmit}
                                disabled={editFormLoading}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              >
                                {editFormLoading ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(rule)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                      {editingRuleId === rule.id && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label htmlFor="edit-categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Category <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    id="edit-categoryId"
                                    name="categoryId"
                                    value={editFormData.categoryId}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                                    required
                                  >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                      <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                  </select>
                                </div>

                                {editSelectedCategory?.subCategories && editSelectedCategory.subCategories.length > 0 && (
                                  <div>
                                    <label htmlFor="edit-subCategoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Sub-Category
                                    </label>
                                    <select
                                      id="edit-subCategoryId"
                                      name="subCategoryId"
                                      value={editFormData.subCategoryId}
                                      onChange={handleEditChange}
                                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                                    >
                                      <option value="">All sub-categories</option>
                                      {editSelectedCategory.subCategories.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                <div>
                                  <label htmlFor="edit-transactionType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Transaction Type <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    id="edit-transactionType"
                                    name="transactionType"
                                    value={editFormData.transactionType}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                                    required
                                  >
                                    <option value="BOTH">Both Online & Offline</option>
                                    <option value="ONLINE">Online Only</option>
                                    <option value="OFFLINE">Offline Only</option>
                                  </select>
                                </div>

                                <div>
                                  <label htmlFor="edit-rewardType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Reward Type <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    id="edit-rewardType"
                                    name="rewardType"
                                    value={editFormData.rewardType}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                                    required
                                  >
                                    <option value="CASHBACK">Cashback</option>
                                    <option value="POINTS">Points</option>
                                    <option value="MILES">Miles</option>
                                  </select>
                                </div>

                                <div>
                                  <label htmlFor="edit-rewardValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Reward Value <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    id="edit-rewardValue"
                                    name="rewardValue"
                                    value={editFormData.rewardValue}
                                    onChange={handleEditChange}
                                    step="0.01"
                                    min="0"
                                    className="mt-1 block w-full px-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                                    required
                                  />
                                </div>

                                <div>
                                  <label htmlFor="edit-monthlyCap" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Monthly Cap (₹)
                                  </label>
                                  <input
                                    type="number"
                                    id="edit-monthlyCap"
                                    name="monthlyCap"
                                    value={editFormData.monthlyCap}
                                    onChange={handleEditChange}
                                    step="0.01"
                                    min="0"
                                    placeholder="Enter amount in ₹"
                                    className="mt-1 block w-full px-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                                  />
                                </div>

                                <div>
                                  <label htmlFor="edit-minimumSpend" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Minimum Spend (₹)
                                  </label>
                                  <input
                                    type="number"
                                    id="edit-minimumSpend"
                                    name="minimumSpend"
                                    value={editFormData.minimumSpend}
                                    onChange={handleEditChange}
                                    step="0.01"
                                    min="0"
                                    placeholder="Enter amount in ₹"
                                    className="mt-1 block w-full px-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                                  />
                                </div>
                              </div>

                              {editFormError && (
                                <div className="mt-4 text-sm text-red-600 dark:text-red-400">{editFormError}</div>
                              )}
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 