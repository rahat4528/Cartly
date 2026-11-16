'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'PASSENGER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>({
    id: 'user_passenger_1',
    email: 'passenger@example.com',
    name: 'David Sterling',
    role: 'PASSENGER'
  });
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    login('passenger@example.com');
  }, []);

  const login = async (email: string) => {
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'Pass123!' }),
      });
      setUser(data.user);
      setToken(data.token);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
