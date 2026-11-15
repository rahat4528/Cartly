'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'DINER' | 'HOST' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, role?: string) => Promise<void>;
  logout: () => void;
  switchDemoUser: (role: 'DINER' | 'HOST' | 'ADMIN') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dining_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchApi('/auth/me')
      .then(userData => setUser(userData))
      .catch(() => {
        localStorage.removeItem('dining_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    localStorage.setItem('dining_token', res.token);
    setUser(res.user);
  };

  const register = async (email: string, pass: string, name: string, role: string = 'DINER') => {
    const res = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, name, role }),
    });
    localStorage.setItem('dining_token', res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('dining_token');
    setUser(null);
  };

  const switchDemoUser = async (role: 'DINER' | 'HOST' | 'ADMIN') => {
    if (role === 'HOST') {
      await login('host@cartly.local', 'Pass123!');
    } else if (role === 'ADMIN') {
      await login('admin@cartly.local', 'AdminPass123!');
    } else {
      await login('diner@cartly.local', 'Pass123!');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
