'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from './api';

export interface User {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  cartCount: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshCartCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  cartCount: 0,
  login: async () => {},
  logout: () => {},
  refreshCartCount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Check local storage for persistent auth
    const savedToken = localStorage.getItem('cartly_bookstore_token');
    const savedUser = localStorage.getItem('cartly_bookstore_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('cartly_bookstore_user');
      }
    } else {
      // Default initial mock login for customer demonstration convenience
      login('customer@cartly.local', 'Pass123!').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshCartCount();
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('cartly_bookstore_token', data.token);
    localStorage.setItem('cartly_bookstore_user', JSON.stringify(data.user));
    await refreshCartCount();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCartCount(0);
    localStorage.removeItem('cartly_bookstore_token');
    localStorage.removeItem('cartly_bookstore_user');
  };

  const refreshCartCount = async () => {
    if (!token) return;
    try {
      const cart = await apiRequest('/cart', {}, token);
      setCartCount(cart.itemCount || 0);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, cartCount, login, logout, refreshCartCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
