import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();
const CART_STORAGE_KEY = 'cartItems';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart items from AsyncStorage on app start
  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      const storedCartItems = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (storedCartItems) {
        const parsedItems = JSON.parse(storedCartItems);
        setCartItems(parsedItems);
        console.log('🛒 Loaded cart items from storage:', parsedItems.length, 'items');
      }
    } catch (error) {
      console.error('❌ Error loading cart items:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveCartItems = async (items) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      console.log('💾 Saved cart items to storage:', items.length, 'items');
    } catch (error) {
      console.error('❌ Error saving cart items:', error);
    }
  };

  const addToCart = (item) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      const newItems = exists ? prev : [...prev, item];
      saveCartItems(newItems); // Persist to AsyncStorage
      return newItems;
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => {
      const newItems = prev.filter((item) => item.id !== id);
      saveCartItems(newItems); // Persist to AsyncStorage
      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartItems([]); // Persist to AsyncStorage
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, isLoaded }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
