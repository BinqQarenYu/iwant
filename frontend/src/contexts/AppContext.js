import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AppContext = createContext();

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('kayntayo_session'));
  const [cart, setCart] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);
  const [language, setLanguage] = useState(localStorage.getItem('kayntayo_lang') || 'en');
  const [loading, setLoading] = useState(true);

  // Translations
  const translations = {
    en: {
      home: 'Home',
      orders: 'Orders',
      pabili: 'Pabili',
      profile: 'Profile',
      search: 'Search restaurants, food...',
      deliverTo: 'Deliver to',
      categories: 'Categories',
      nearYou: 'Near You',
      viewAll: 'View All',
      addToCart: 'Add to Cart',
      viewCart: 'View Cart',
      checkout: 'Checkout',
      orderNow: 'Order Now',
      trackOrder: 'Track Order',
      myOrders: 'My Orders',
      noOrders: 'No orders yet',
      startOrdering: 'Start ordering your favorite food!',
      cart: 'Cart',
      emptyCart: 'Your cart is empty',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery Fee',
      total: 'Total',
      paymentMethod: 'Payment Method',
      cod: 'Cash on Delivery',
      deliveryAddress: 'Delivery Address',
      placeOrder: 'Place Order',
      orderPlaced: 'Order Placed!',
      preparing: 'Preparing',
      onTheWay: 'On the Way',
      delivered: 'Delivered',
      login: 'Login',
      register: 'Register',
      name: 'Name',
      pabiliService: 'Pabili Service',
      pabiliDesc: 'Need groceries? Let our riders shop for you!',
      itemsList: 'Items to buy',
      storeLocation: 'Store location',
      estimatedBudget: 'Estimated budget',
      submitRequest: 'Submit Request',
      serviceFee: 'Service Fee',
      openNow: 'Open Now',
      closed: 'Closed',
      minOrder: 'Min. Order',
      delivery: 'Delivery',
      mins: 'mins',
      reviews: 'reviews',
      menu: 'Menu',
      specialInstructions: 'Special instructions (optional)',
      quantity: 'Quantity',
    },
    tl: {
      home: 'Bahay',
      orders: 'Mga Order',
      pabili: 'Pabili',
      profile: 'Profile',
      search: 'Maghanap ng restaurant, pagkain...',
      deliverTo: 'I-deliver sa',
      categories: 'Mga Kategorya',
      nearYou: 'Malapit Sayo',
      viewAll: 'Tingnan Lahat',
      addToCart: 'Idagdag sa Cart',
      viewCart: 'Tingnan Cart',
      checkout: 'Checkout',
      orderNow: 'Mag-order Na',
      trackOrder: 'I-track ang Order',
      myOrders: 'Mga Order Ko',
      noOrders: 'Wala pang order',
      startOrdering: 'Simulan na mag-order ng paborito mong pagkain!',
      cart: 'Cart',
      emptyCart: 'Walang laman ang cart mo',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery Fee',
      total: 'Kabuuan',
      paymentMethod: 'Paraan ng Bayad',
      cod: 'Bayad Pagdating',
      deliveryAddress: 'Address ng Delivery',
      placeOrder: 'Mag-order',
      orderPlaced: 'Nai-order Na!',
      preparing: 'Inihahanda',
      onTheWay: 'Papunta Na',
      delivered: 'Na-deliver',
      login: 'Mag-login',
      register: 'Mag-register',
      name: 'Pangalan',
      pabiliService: 'Serbisyong Pabili',
      pabiliDesc: 'Kailangan ng grocery? Hayaan ang aming rider mamili para sayo!',
      itemsList: 'Mga bibilhin',
      storeLocation: 'Lokasyon ng tindahan',
      estimatedBudget: 'Tinatayang budget',
      submitRequest: 'I-submit ang Request',
      serviceFee: 'Service Fee',
      openNow: 'Bukas Ngayon',
      closed: 'Sarado',
      minOrder: 'Min. Order',
      delivery: 'Delivery',
      mins: 'minuto',
      reviews: 'reviews',
      menu: 'Menu',
      specialInstructions: 'Espesyal na instruksiyon (opsyonal)',
      quantity: 'Dami',
    }
  };

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  }, [language]);

  // Set up axios interceptor for session token
  useEffect(() => {
    if (sessionToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [sessionToken]);

  // Load user on mount - check session
  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      if (sessionToken) {
        try {
          const response = await axios.get(`${API}/auth/me`);
          setUser(response.data);
        } catch (error) {
          console.error('Session invalid:', error);
          localStorage.removeItem('kayntayo_session');
          setSessionToken(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [sessionToken]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('kayntayo_cart');
    const savedRestaurant = localStorage.getItem('kayntayo_cart_restaurant');
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedRestaurant) setCartRestaurant(JSON.parse(savedRestaurant));
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('kayntayo_cart', JSON.stringify(cart));
    if (cartRestaurant) {
      localStorage.setItem('kayntayo_cart_restaurant', JSON.stringify(cartRestaurant));
    }
  }, [cart, cartRestaurant]);

  // Exchange Google Auth session_id for session_token
  const exchangeSession = useCallback(async (sessionId) => {
    const response = await axios.post(`${API}/auth/session`, { session_id: sessionId });
    const { user: userData, session_token } = response.data;
    localStorage.setItem('kayntayo_session', session_token);
    setSessionToken(session_token);
    setUser(userData);
    return userData;
  }, []);

  // Switch role (for Sync Dashboard)
  const switchRole = useCallback(async (role) => {
    const response = await axios.put(`${API}/auth/switch-role`, { role });
    setUser(response.data);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (e) {
      // Ignore logout errors
    }
    localStorage.removeItem('kayntayo_session');
    setSessionToken(null);
    setUser(null);
    clearCart();
  }, []);

  const addToCart = (item, restaurant, quantity = 1, specialInstructions = '') => {
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      setCart([]);
    }
    setCartRestaurant(restaurant);

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(
        ci => ci.menu_item_id === item.id && ci.special_instructions === specialInstructions
      );

      if (existingIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      }

      return [...prevCart, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity,
        special_instructions: specialInstructions,
        image_url: item.image_url
      }];
    });
  };

  const updateCartItemQuantity = (index, quantity) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter((_, i) => i !== index);
      }
      const newCart = [...prevCart];
      newCart[index].quantity = quantity;
      return newCart;
    });
  };

  const removeFromCart = (index) => {
    setCart(prevCart => prevCart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setCartRestaurant(null);
    localStorage.removeItem('kayntayo_cart');
    localStorage.removeItem('kayntayo_cart_restaurant');
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'tl' : 'en';
    setLanguage(newLang);
    localStorage.setItem('kayntayo_lang', newLang);
  };

  const value = {
    user,
    setUser,
    sessionToken,
    cart,
    cartRestaurant,
    language,
    loading,
    t,
    exchangeSession,
    switchRole,
    logout,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    toggleLanguage,
    API,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
