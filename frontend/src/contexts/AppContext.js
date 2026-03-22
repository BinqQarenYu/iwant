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
  const [token, setToken] = useState(localStorage.getItem('kayntayo_token'));
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
      phoneNumber: 'Phone Number',
      enterOtp: 'Enter OTP',
      verifyOtp: 'Verify OTP',
      sendOtp: 'Send OTP',
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
      phoneNumber: 'Numero ng Telepono',
      enterOtp: 'Ilagay ang OTP',
      verifyOtp: 'I-verify ang OTP',
      sendOtp: 'Magpadala ng OTP',
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

  // Set up axios interceptor
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`);
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('kayntayo_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('kayntayo_cart');
    const savedRestaurant = localStorage.getItem('kayntayo_cart_restaurant');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    if (savedRestaurant) {
      setCartRestaurant(JSON.parse(savedRestaurant));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('kayntayo_cart', JSON.stringify(cart));
    if (cartRestaurant) {
      localStorage.setItem('kayntayo_cart_restaurant', JSON.stringify(cartRestaurant));
    }
  }, [cart, cartRestaurant]);

  const login = async (phone, otp, name = null, role = 'customer') => {
    const response = await axios.post(`${API}/auth/verify-otp`, {
      phone,
      otp,
      name,
      role
    });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('kayntayo_token', newToken);
    setToken(newToken);
    setUser(userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('kayntayo_token');
    setToken(null);
    setUser(null);
    clearCart();
  };

  const sendOtp = async (phone) => {
    const response = await axios.post(`${API}/auth/send-otp`, { phone });
    return response.data;
  };

  const addToCart = (item, restaurant, quantity = 1, specialInstructions = '') => {
    // If adding from different restaurant, clear cart
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
    token,
    cart,
    cartRestaurant,
    language,
    loading,
    t,
    login,
    logout,
    sendOtp,
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
