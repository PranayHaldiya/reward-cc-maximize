// API utility functions for making requests to the backend

const API_BASE_URL = 'http://localhost:3001';

interface ApiError {
  message: string;
  status?: number;
}

interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

interface CreditCard {
  id: string;
  name: string;
  bankId: string;
  annualFee: number;
  rewardsRate: number;
  welcomeBonus: number;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generic function to make API requests
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Remove /api prefix if it's already in the endpoint
  const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
  const url = `${baseUrl}/api${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;
  
  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('Request Body:', options.body);
    }
    if (options.headers) {
      console.log('Request Headers:', options.headers);
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log(`API Response Status: ${response.status} ${response.statusText}`);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Handle non-2xx responses
    if (!response.ok) {
      const text = await response.text();
      console.error('Error Response Body:', text);
      
      let errorData;
      try {
        errorData = text ? JSON.parse(text) : { message: response.statusText };
      } catch (parseError) {
        errorData = { message: text || response.statusText };
      }
      
      const errorMessage = errorData.message || `API Error: ${response.status} ${response.statusText}`;
      console.error('API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url,
        errorMessage,
        errorData
      });
      throw new Error(errorMessage);
    }
    
    // For 204 No Content responses, return empty object
    if (response.status === 204) {
      return {};
    }
    
    const text = await response.text();
    console.log('Response Body:', text);
    
    if (!text) {
      console.log('Empty response body, returning empty object');
      return {};
    }
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed Response:', data);
      return data;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return { message: text };
    }
  } catch (error) {
    console.error('API Request Failed:', {
      url,
      method: options.method || 'GET',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Register a new user
 */
export async function register(userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  try {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Login a user
 */
export async function login(email: string, password: string) {
  try {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.access_token) {
      localStorage.setItem('auth_token', response.access_token);
      return response;
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Get the current user's profile
 */
export async function getUserProfile() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)
    
    // Then use the user ID to fetch the user profile
    return apiRequest(`/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error decoding token or fetching user profile:', error);
    throw new Error('Failed to get user profile');
  }
}

/**
 * Get the user's credit cards
 */
export async function getUserCreditCards() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)
    
    // Then use the user ID to fetch the user's credit cards
    return apiRequest(`/api/users/${userId}/credit-cards`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error decoding token or fetching credit cards:', error);
    throw new Error('Failed to get user credit cards');
  }
}

/**
 * Get reward summary for the user
 */
export async function getRewardSummary() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)
    
    // Then use the user ID to fetch the reward summary
    return apiRequest(`/api/users/${userId}/rewards/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error decoding token or fetching reward summary:', error);
    throw new Error('Failed to get reward summary');
  }
}

/**
 * Add a new credit card for the user
 */
export const addCreditCard = async (cardData: {
  creditCardId: string;
  cardNumber?: string;
  expiryDate?: string;
}) => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)

    if (!userId) {
      throw new Error('User ID not found in token');
    }

    console.log('Adding credit card:', cardData);

    // Then use the user ID to add a credit card
    const response = await apiRequest(`/api/users/${userId}/credit-cards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        creditCardId: cardData.creditCardId,
        cardNumber: cardData.cardNumber,
        expiryDate: cardData.expiryDate
      }),
    });

    return { data: response };
  } catch (error) {
    console.error('Error adding credit card:', error);
    throw error;
  }
}

/**
 * Get all available credit cards
 */
export async function getAllCreditCards() {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    console.log('Fetching all credit cards...');
    const response = await apiRequest('/api/credit-cards', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Credit cards response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching all credit cards:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userData: {
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)
    
    // Then use the user ID to update the user profile
    return apiRequest(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error('Error decoding token or updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

/**
 * Change user password
 */
export async function changePassword(passwordData: {
  currentPassword: string;
  newPassword: string;
}) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)
    
    // Then use the user ID to change the password
    return apiRequest(`/api/users/${userId}/change-password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });
  } catch (error) {
    console.error('Error decoding token or changing password:', error);
    throw new Error('Failed to change password');
  }
}

/**
 * Store authentication token in localStorage
 */
export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Get authentication token from localStorage
 */
export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Remove authentication token from localStorage
 */
export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Get a specific user credit card by ID
 */
export async function getUserCreditCard(cardId: string) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)

    // Try to get the card directly from the API first
    try {
      // Direct API call to get the card with all details
      const cardData = await apiRequest(`/api/credit-cards/${cardId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Card data from direct API call:', cardData);
      return cardData;
    } catch (directApiError) {
      console.warn('Could not fetch card directly, falling back to user cards:', directApiError);
      
      // Fallback: Get all user credit cards and find the specific one
      const userCards = await getUserCreditCards();
      
      // Find the specific card by ID
      interface CreditCard {
        id: string;
        name: string;
        [key: string]: any; // Allow for other properties
      }
      
      const card = userCards.find((card: CreditCard) => card.id === cardId);
      
      if (!card) {
        throw new Error(`Credit card with ID ${cardId} not found`);
      }
      
      return card;
    }
  } catch (error) {
    console.error('Error fetching user credit card:', error);
    throw error;
  }
}

/**
 * Get a specific credit card by ID
 * @param id The ID of the credit card to retrieve
 * @returns The credit card data
 */
export async function getCreditCard(id: string) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication token is required');
  }

  try {
    // Direct API call to get the card with all details
    const response = await apiRequest(`/api/credit-cards/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response) {
      throw new Error('No response received from server');
    }
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (response.statusCode === 404 || !response.id) {
      throw new Error(`Credit card with ID ${id} not found`);
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching credit card:', error);
    throw error;
  }
}

/**
 * Check if the user has a specific credit card
 * @param cardId The ID of the credit card to check
 * @returns The user's credit card if found, null otherwise
 */
export async function checkUserHasCard(cardId: string) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication token is required');
  }

  try {
    const userCards = await getUserCreditCards();
    
    if (!Array.isArray(userCards)) {
      return null;
    }
    
    const foundCard = userCards.find((card: any) => 
      card.id === cardId || 
      (card.creditCard && card.creditCard.id === cardId)
    );
    
    return foundCard || null;
  } catch (error) {
    console.error('Error checking if user has card:', error);
    return null;
  }
}

/**
 * Delete a user's credit card
 * @param cardId The ID of the credit card to delete
 */
export async function deleteUserCreditCard(cardId: string) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)

    if (!userId) {
      throw new Error('User ID not found in token');
    }

    const endpoint = `/api/users/${userId}/credit-cards/${cardId}`;
    console.log('Deleting card:', {
      userId,
      cardId,
      endpoint
    });

    // Use the same endpoint pattern as getUserCreditCards
    const response = await apiRequest(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Delete API response:', response);

    // After successful deletion, refresh the user's cards
    const updatedCards = await getUserCreditCards();
    console.log('Updated cards after deletion:', updatedCards);
    
    return { success: true, updatedCards };
  } catch (error: any) {
    // Log the complete error details
    console.error('Error in deleteUserCreditCard:', {
      error,
      message: error.message,
      cardId,
      status: error.status,
      response: error.response,
      stack: error.stack
    });
    
    // Handle specific error cases with more descriptive messages
    if (error.message.includes('404')) {
      throw new Error('Credit card not found or already deleted');
    } else if (error.message.includes('403')) {
      throw new Error('You do not have permission to delete this credit card');
    } else if (error.message.includes('401')) {
      throw new Error('Authentication failed. Please log in again');
    } else if (error.message.includes('Cannot DELETE')) {
      throw new Error('The server does not support deleting credit cards at this endpoint. Please contact support.');
    }
    
    // If no specific error case matches, throw a user-friendly error
    throw new Error('Failed to delete credit card. Please try again later.');
  }
}

export const parseError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}; 