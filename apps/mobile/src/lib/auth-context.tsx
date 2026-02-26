import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { getMe } from './api';

// Lazy-load SecureStore to avoid crashes if native module isn't ready
let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch {}

interface User {
  id: string;
  email: string;
  role: string;
  account?: {
    id: string;
    accountNumber: string;
    firstName: string;
    lastName: string;
    status: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

const TOKEN_KEY = 'egx_token';

function getStoredToken(): string | null {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    }
    return SecureStore?.getItem?.(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

function storeToken(token: string): void {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      SecureStore?.setItem?.(TOKEN_KEY, token);
    }
  } catch {}
}

function removeToken(): void {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      SecureStore?.deleteItem?.(TOKEN_KEY);
    }
  } catch {}
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  setAuth: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const stored = getStoredToken();
        if (stored) {
          const res = await getMe(stored);
          if (!cancelled) {
            setToken(stored);
            setUser(res.data);
          }
        }
      } catch {
        try { removeToken(); } catch {}
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const setAuth = useCallback((newToken: string, newUser: User) => {
    storeToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
