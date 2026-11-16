'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'GUEST' | 'HOST' | 'ADMIN';
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('airbnb_token');
    const savedUser = localStorage.getItem('airbnb_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else {
      login('guest@example.com').catch(() => {});
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'Pass123!' }),
      });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('airbnb_token', data.token);
      localStorage.setItem('airbnb_user', JSON.stringify(data.user));
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('airbnb_token');
    localStorage.removeItem('airbnb_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
