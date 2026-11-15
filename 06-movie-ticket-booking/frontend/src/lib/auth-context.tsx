'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, fetchApi } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  quickSwitch: (role: 'patron' | 'usher') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('cartly_cinema_token');
    if (savedToken) {
      setToken(savedToken);
      fetchApi<User>('/auth/me', {}, savedToken)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('cartly_cinema_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetchApi<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('cartly_cinema_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('cartly_cinema_token');
    setToken(null);
    setUser(null);
  };

  const quickSwitch = async (role: 'patron' | 'usher') => {
    if (role === 'patron') {
      await login('patron@example.com', 'Pass123!');
    } else {
      await login('usher@example.com', 'Pass123!');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, quickSwitch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
