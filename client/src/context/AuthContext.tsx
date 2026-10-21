import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import { User } from '../types';

interface RegisterData {
  email: string;
  username: string;
  password: string;
  role?: string;
  ign?: string;
  bgmiUid?: string;
  primaryRole?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (typeof res.data !== 'object' || !res.data?.user) {
      throw new Error('Invalid response from server. Please ensure the backend server is running.');
    }
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
    }
    setUser(res.data.user);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data);
    if (typeof res.data !== 'object' || !res.data?.user) {
      throw new Error('Invalid response from server. Please ensure the backend server is running.');
    }
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
    }
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignored
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
