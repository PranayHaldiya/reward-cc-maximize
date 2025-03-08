'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, apiRequest } from '../../../lib/api';

interface CreditCard {
  id: string;
  name: string;
  bank: {
    id: string;
    name: string;
    logo: string | null;
  };
  image: string | null;
  annualFee: number;
}

export default function CreditCardsPage() {
  const router = useRouter();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
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
      
      // Fetch credit cards
      fetchCreditCards();
      
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router]);
  
  const fetchCreditCards = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const data = await apiRequest('/api/credit-cards', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setCreditCards(data);
      
    } catch (err) {
      console.error('Error fetching credit cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load credit cards');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this credit card? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(cardId);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      await apiRequest(`/api/credit-cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove the card from the state
      setCreditCards((prevCards) => prevCards.filter((card) => card.id !== cardId));
    } catch (err) {
      console.error('Error deleting credit card:', err);
      alert('Failed to delete credit card. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Loading...</h1>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Error</h1>
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button 
            onClick={() => fetchCreditCards()} 
            className="mt-4 bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700"
          >
            Try Again
          </button>
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
              Credit Cards
            </h1>
            <div className="flex space-x-4">
              <Link href="/admin" className="bg-gray-500 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                Back to Admin
              </Link>
              <Link href="/admin/credit-cards/new" className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Add New Card
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {creditCards.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <p className="text-gray-500 dark:text-gray-400">No credit cards have been added yet.</p>
              <Link href="/admin/credit-cards/new" className="mt-4 inline-block text-blue-500 dark:text-blue-400 hover:underline">
                Add your first credit card
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creditCards.map(card => (
                <div key={card.id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <div className="relative aspect-[16/10] w-full bg-gray-200 dark:bg-gray-700">
                    {card.image ? (
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                    )}
                    {card.bank?.logo && (
                      <div className="absolute top-2 right-2 w-12 h-12 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-md">
                        <img
                          src={card.bank.logo}
                          alt={`${card.bank.name} logo`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      disabled={isDeleting === card.id}
                      className="absolute top-2 left-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors duration-200 group"
                    >
                      <svg
                        className="w-5 h-5 text-red-500 group-hover:text-red-600 dark:group-hover:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      {isDeleting === card.id && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">{card.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 truncate">{card.bank.name}</p>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Annual Fee:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        ₹{card.annualFee.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      <Link 
                        href={`/admin/credit-cards/${card.id}`}
                        className="inline-flex items-center text-blue-500 dark:text-blue-400 hover:underline"
                      >
                        <span>View Details</span>
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <Link 
                        href={`/admin/credit-cards/${card.id}/rewards`}
                        className="inline-flex items-center text-green-500 dark:text-green-400 hover:underline"
                      >
                        <span>Manage Rewards</span>
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 