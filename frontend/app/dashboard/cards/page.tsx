'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardNav from '../../components/DashboardNav';
import { getUserCreditCards, getAllCreditCards, addCreditCard, deleteUserCreditCard, getToken } from '../../../lib/api';
import Image from 'next/image';

interface Bank {
  id: string;
  name: string;
  logo: string | null;
}

interface UserCreditCard {
  id: string;
  creditCard: {
    id: string;
    name: string;
    bank: Bank;
    image?: string;
  };
  cardNumber: string | null;
  expiryDate: string | null;
  rewardBalance?: number;
  rewardType?: 'CASHBACK' | 'POINTS' | 'MILES';
}

interface AvailableCreditCard {
  id: string;
  name: string;
  bank: Bank;
  image?: string;
  annualFee?: number;
}

export default function CardsPage() {
  const router = useRouter();
  const [userCards, setUserCards] = useState<UserCreditCard[]>([]);
  const [availableCards, setAvailableCards] = useState<AvailableCreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch data
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch user's credit cards
        const userCardsData = await getUserCreditCards();
        setUserCards(userCardsData || []);

        // Fetch all available credit cards
        const allCardsData = await getAllCreditCards();
        
        // Filter out cards that the user already has
        const userCardIds = userCardsData ? userCardsData.map((card: any) => card.id) : [];
        const filteredAvailableCards = allCardsData ? allCardsData.filter((card: any) => !userCardIds.includes(card.id)) : [];
        
        setAvailableCards(filteredAvailableCards);

      } catch (err) {
        console.error('Error fetching credit cards:', err);
        setError('Failed to load credit card data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Function to calculate reward value based on type
  const formatRewardValue = (card: UserCreditCard) => {
    if (!card.rewardBalance && card.rewardBalance !== 0) return '0';
    
    if (card.rewardType === 'CASHBACK') {
      return `₹${card.rewardBalance.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    } else {
      return card.rewardBalance.toLocaleString('en-IN');
    }
  };

  const handleAddCard = async () => {
    try {
      setLoading(true);
      
      // Refresh the available cards
      const userCardsData = await getUserCreditCards();
      console.log('User cards:', userCardsData);
      
      const allCardsData = await getAllCreditCards();
      console.log('All cards:', allCardsData);
      
      // Filter out cards that the user already has
      const userCardIds = userCardsData ? userCardsData.map((card: any) => card.id) : [];
      console.log('User card IDs:', userCardIds);
      
      const filteredAvailableCards = allCardsData ? allCardsData.filter((card: any) => !userCardIds.includes(card.id)) : [];
      console.log('Filtered available cards:', filteredAvailableCards);
      
      setAvailableCards(filteredAvailableCards);
      
      if (filteredAvailableCards.length === 0) {
        // If no cards are available, show an error message
        setError('No credit cards available to add. Please try again later.');
        return;
      }
      
      // Clear any previous errors
      setError('');
      setShowAddCardModal(true);
    } catch (err) {
      console.error('Error refreshing credit cards:', err);
      setError('Failed to load credit card data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddCardModal(false);
    setSelectedCard(null);
    setCardDetails({
      cardNumber: '',
      expiryDate: '',
    });
  };

  const handleCardSelection = (cardId: string) => {
    console.log('Selected card ID:', cardId);
    setSelectedCard(cardId);
  };

  const handleCardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCard) {
      return;
    }

    try {
      setSubmitting(true);

      // Format the expiry date properly
      let formattedExpiryDate: string | undefined = undefined;
      if (cardDetails.expiryDate) {
        // Convert MM/YY format to a valid date string
        const [month, year] = cardDetails.expiryDate.split('/');
        if (month && year && month.length === 2 && year.length === 2) {
          // Create a date for the last day of the expiry month
          const fullYear = `20${year}`;
          const lastDayOfMonth = new Date(parseInt(fullYear), parseInt(month), 0).getDate();
          formattedExpiryDate = `${fullYear}-${month}-${lastDayOfMonth}`;
        }
      }

      await addCreditCard({
        creditCardId: selectedCard,
        cardNumber: cardDetails.cardNumber || undefined,
        expiryDate: formattedExpiryDate
      });

      // Refresh user cards
      const updatedCards = await getUserCreditCards();
      setUserCards(updatedCards || []);

      // Close modal
      handleCloseModal();
    } catch (err) {
      console.error('Error adding credit card:', err);
      setError('Failed to add credit card. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (cardId: string) => {
    setCardToDelete(cardId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;

    try {
      setDeleting(true);
      console.log('Attempting to delete card:', cardToDelete);
      
      const response = await deleteUserCreditCard(cardToDelete);
      console.log('Delete response:', response);
      
      if (response.success) {
        // Update the cards list with the returned data
        if (response.updatedCards) {
          setUserCards(response.updatedCards);
        } else {
          // Fallback: fetch cards if not returned in response
          const updatedCards = await getUserCreditCards();
          setUserCards(updatedCards || []);
        }
        
        // Close the modal
        setShowDeleteModal(false);
        setCardToDelete(null);
      } else {
        throw new Error('Failed to delete card');
      }
    } catch (err: any) {
      console.error('Error deleting credit card:', err);
      const errorMessage = err.message || 'Failed to delete credit card. Please try again later.';
      console.error('Full error details:', {
        message: errorMessage,
        cardId: cardToDelete,
        error: err
      });
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCardToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <DashboardNav activePage="cards" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardNav activePage="cards" />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Credit Cards</h1>
          <button
            onClick={handleAddCard}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Add Credit Card
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {userCards.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">You haven't added any credit cards yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCards.map((card) => (
              <div key={card.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105">
                {/* Card Image - Standard credit card aspect ratio is 85.60 × 53.98 mm (1.586:1) */}
                <div className="relative w-full" style={{ paddingTop: '63%' }}> {/* 1/1.586 ≈ 63% */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                    {card.creditCard?.image ? (
                      <img
                        src={card.creditCard.image}
                        alt={`${card.creditCard.name} card`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">{card.creditCard?.name}</span>
                      </div>
                    )}
                    {/* Bank Logo */}
                    {card.creditCard?.bank?.logo && (
                      <div className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full p-2 shadow-md">
                        <Image
                          src={card.creditCard.bank.logo || '/placeholder-card.png'}
                          alt={`${card.creditCard.bank.name || 'Bank'} logo`}
                          width={48}
                          height={48}
                          className="object-contain w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {card.creditCard?.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {card.creditCard?.bank?.name || 'Unknown Bank'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(card.id)}
                      className="text-red-500 hover:text-red-600 transition-colors duration-200"
                      title="Delete card"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {/* Card Number (last 4 digits) */}
                  {card.cardNumber && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      •••• {card.cardNumber.slice(-4)}
                    </p>
                  )}

                  {/* Expiry Date */}
                  {card.expiryDate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Expires: {new Date(card.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}
                    </p>
                  )}

                  {/* Reward Balance */}
                  {(card.rewardBalance !== undefined || card.rewardType) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {card.rewardType === 'CASHBACK' ? 'Cashback Balance' : 
                         card.rewardType === 'POINTS' ? 'Points Balance' : 
                         card.rewardType === 'MILES' ? 'Miles Balance' : 'Rewards'}:
                        <span className="ml-2 text-blue-500">
                          {formatRewardValue(card)}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* View Details Button */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => router.push(`/dashboard/cards/${card.creditCard.id}`)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200"
                    >
                      View Details
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Card Modal */}
        {showAddCardModal && (
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-[60]">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                      Add Credit Card
                    </h3>

                    <form onSubmit={handleSubmitCard}>
                      <div className="mb-4">
                        <label htmlFor="card-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Card
                        </label>
                        <select
                          id="card-select"
                          className="relative z-[70] mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                          value={selectedCard || ''}
                          onChange={(e) => handleCardSelection(e.target.value)}
                          required
                        >
                          <option value="">Select a card</option>
                          {availableCards.map((card) => (
                            <option key={card.id} value={card.id}>
                              {card.bank?.name || 'Unknown Bank'} - {card.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Card Number (Last 4 digits)
                        </label>
                        <input
                          type="text"
                          id="card-number"
                          name="cardNumber"
                          maxLength={4}
                          pattern="\d{4}"
                          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          value={cardDetails.cardNumber}
                          onChange={handleCardDetailsChange}
                          placeholder="1234"
                        />
                      </div>

                      <div className="mb-6">
                        <label htmlFor="expiry-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Expiry Date (MM/YY)
                        </label>
                        <input
                          type="text"
                          id="expiry-date"
                          name="expiryDate"
                          maxLength={5}
                          pattern="\d{2}/\d{2}"
                          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          value={cardDetails.expiryDate}
                          onChange={handleCardDetailsChange}
                          placeholder="MM/YY"
                        />
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={submitting || !selectedCard}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Adding...' : 'Add Card'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-[60]">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Delete Credit Card
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this credit card? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCancel}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 