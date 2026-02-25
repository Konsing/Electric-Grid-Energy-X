import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getMe } from './api';

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
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('egx_token');
        if (stored) {
          const res = await getMe(stored);
          setToken(stored);
          setUser(res.data);
        }
      } catch {
        await SecureStore.deleteItemAsync('egx_token');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setAuth = useCallback(async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync('egx_token', newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('egx_token');
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
