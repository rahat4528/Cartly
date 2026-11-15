'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from './api';
import { SyncQueue, QueuedAction } from './sync-queue';

export interface User {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isOnline: boolean;
  cartCount: number;
  pendingCount: number;
  updateAvailable: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  syncPendingActions: () => Promise<any>;
  enqueueAction: (actionType: QueuedAction['actionType'], payload: any) => QueuedAction;
  refreshCart: () => Promise<void>;
  dismissUpdate: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isOnline: true,
  cartCount: 0,
  pendingCount: 0,
  updateAvailable: false,
  login: async () => {},
  logout: () => {},
  syncPendingActions: async () => {},
  enqueueAction: () => ({} as any),
  refreshCart: async () => {},
  dismissUpdate: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [cartCount, setCartCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    // 1. Online / Offline listeners
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        // Automatic background sync when connectivity returns
        syncPendingActions();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Check initial pending queue count
      setPendingCount(SyncQueue.getQueue().length);

      // Register Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              };
            }
          };
        }).catch(() => {});
      }

      // Check stored auth
      const savedToken = localStorage.getItem('cartly_pwa_token');
      const savedUser = localStorage.getItem('cartly_pwa_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        try {
          setUser(JSON.parse(savedUser));
        } catch {}
      } else {
        // Auto-sign in default customer for seamless demo experience
        login('customer@cartly.local', 'Pass123!').catch(() => {});
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    if (token && isOnline) {
      refreshCart();
    }
  }, [token, isOnline]);

  const login = async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('cartly_pwa_token', data.token);
    localStorage.setItem('cartly_pwa_user', JSON.stringify(data.user));
    await refreshCart();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCartCount(0);
    localStorage.removeItem('cartly_pwa_token');
    localStorage.removeItem('cartly_pwa_user');
  };

  const refreshCart = async () => {
    if (!token || !isOnline) return;
    try {
      const cart = await apiRequest('/cart', {}, token);
      setCartCount(cart.itemCount || 0);
    } catch {}
  };

  const enqueueAction = (actionType: QueuedAction['actionType'], payload: any) => {
    const action = SyncQueue.enqueue(actionType, payload);
    setPendingCount(SyncQueue.getQueue().length);
    return action;
  };

  const syncPendingActions = async () => {
    const queue = SyncQueue.getQueue();
    if (queue.length === 0 || !token) return null;

    try {
      const res = await apiRequest('/sync/batch', {
        method: 'POST',
        body: JSON.stringify({ events: queue })
      }, token);

      SyncQueue.clearQueue();
      setPendingCount(0);
      if (res.cart) {
        setCartCount(res.cart.itemCount || 0);
      }
      return res;
    } catch (err) {
      console.error('Sync failed:', err);
      return null;
    }
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isOnline,
        cartCount,
        pendingCount,
        updateAvailable,
        login,
        logout,
        syncPendingActions,
        enqueueAction,
        refreshCart,
        dismissUpdate
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
