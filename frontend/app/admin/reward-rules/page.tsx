'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, apiRequest } from '../../../lib/api';

interface RewardRule {
  id: string;
  creditCardId: string;
  categoryId: string;
  rewardType: 'CASHBACK' | 'POINTS' | 'MILES';
  rewardValue: number;
  minSpend: number | null;
  maxReward: number | null;
  startDate: string | null;
  endDate: string | null;
  creditCard: {
    name: string;
    bank: {
      name: string;
    };
  };
  category: {
    name: string;
  };
}

export default function RewardRulesPage() {
  const router = useRouter();
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      
      // Fetch reward rules
      fetchRewardRules();
      
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router]);

  const fetchRewardRules = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const data = await apiRequest('/api/reward-rules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setRewardRules(data);
      
    } catch (err) {
      console.error('Error fetching reward rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reward rules');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reward Rules
            </h1>
            <div className="flex space-x-4">
              <Link href="/admin" className="bg-gray-500 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                Back to Admin
              </Link>
              <Link href="/admin/reward-rules/new" className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Add New Rule
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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

          {rewardRules.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <p className="text-gray-500 dark:text-gray-400">No reward rules have been added yet.</p>
              <Link href="/admin/reward-rules/new" className="mt-4 inline-block text-blue-500 dark:text-blue-400 hover:underline">
                Add your first reward rule
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {rewardRules.map((rule) => (
                  <li key={rule.id} className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {rule.creditCard.name} - {rule.category.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {rule.creditCard.bank.name}
                          </p>
                        </div>
                        <Link
                          href={`/admin/reward-rules/${rule.id}`}
                          className="text-blue-500 dark:text-blue-400 hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Reward Type:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{rule.rewardType}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Reward Value:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{rule.rewardValue}%</span>
                        </div>
                        {rule.minSpend && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Min Spend:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">₹{rule.minSpend}</span>
                          </div>
                        )}
                        {rule.maxReward && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Max Reward:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">₹{rule.maxReward}</span>
                          </div>
                        )}
                      </div>
                      {(rule.startDate || rule.endDate) && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Valid: {rule.startDate ? new Date(rule.startDate).toLocaleDateString() : 'Always'} 
                          {' - '} 
                          {rule.endDate ? new Date(rule.endDate).toLocaleDateString() : 'Forever'}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

