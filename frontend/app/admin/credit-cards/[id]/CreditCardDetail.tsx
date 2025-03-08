'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, apiRequest } from '../../../../lib/api';

interface Bank {
  id: string;
  name: string;
  logo: string | null;
}

interface RewardRule {
  id: string;
  categoryId: string;
  category: {
    name: string;
  };
  subCategoryId?: string;
  subCategory?: {
    name: string;
  };
  rewardType: string;
  rewardValue: number;
  transactionType: string;
  monthlyCap?: number;
  minimumSpend?: number;
}

interface CreditCard {
  id: string;
  name: string;
  bank: Bank;
  image: string | null;
  annualFee: number;
  rewardType: string;
  rewardRules: RewardRule[];
}

interface Props {
  id: string;
}

export default function CreditCardDetail({ id }: Props) {
  const router = useRouter();
  const [creditCard, setCreditCard] = useState<CreditCard | null>(null);
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
      
      // Fetch credit card details
      fetchCreditCard();
      
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router, id]);
  
  const fetchCreditCard = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const data = await apiRequest(`/api/credit-cards/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!data || !data.id) {
        throw new Error('Invalid credit card data received');
      }
      
      console.log('Credit card data:', data);
      setCreditCard(data);
      
    } catch (err) {
      console.error('Error fetching credit card:', err);
      setError(err instanceof Error ? err.message : 'Failed to load credit card data');
    } finally {
      setLoading(false);
    }
  };
  
  // Format reward value based on reward type
  const formatRewardValue = (rewardType: string, value: number) => {
    switch (rewardType) {
      case 'CASHBACK':
        return `${value}% cashback`;
      case 'POINTS':
        return `${value} points per ₹1`;
      case 'MILES':
        return `${value} miles per ₹1`;
      default:
        return `${value}`;
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <Link href="/admin/credit-cards" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
            &larr; Back to Credit Cards
          </Link>
        </div>
      </div>
    );
  }
  
  if (!creditCard) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Credit Card Not Found</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">The requested credit card could not be found.</p>
          <Link href="/admin/credit-cards" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
            &larr; Back to Credit Cards
          </Link>
        </div>
