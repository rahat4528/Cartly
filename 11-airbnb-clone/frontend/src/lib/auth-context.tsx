'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, fetchApi } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  quickSwitch: (role: 'GUEST' | 'HOST') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>({
    id: 'user_guest_1',
    email: 'guest@example.com',
    name: 'Maya Lin',
    role: 'GUEST'
  });
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    quickSwitch('GUEST');
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

  const quickSwitch = async (role: 'GUEST' | 'HOST') => {
    const email = role === 'GUEST' ? 'guest@example.com' : 'host@cartlystays.com';
    await login(email);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, quickSwitch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
