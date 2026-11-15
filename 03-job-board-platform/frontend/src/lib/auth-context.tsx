'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';
  companyId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: 'JOB_SEEKER' | 'EMPLOYER') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  switchRole: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('cartly_jobboard_token');
    const savedUser = localStorage.getItem('cartly_jobboard_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    } else {
      // Default initial login as candidate
      login('candidate@cartly.local', 'Pass123!').catch(() => {});
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('cartly_jobboard_token', data.token);
    localStorage.setItem('cartly_jobboard_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cartly_jobboard_token');
    localStorage.removeItem('cartly_jobboard_user');
  };

  const switchRole = async (role: 'JOB_SEEKER' | 'EMPLOYER') => {
    if (role === 'EMPLOYER') {
      await login('employer@cartly.local', 'Pass123!');
    } else {
      await login('candidate@cartly.local', 'Pass123!');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
