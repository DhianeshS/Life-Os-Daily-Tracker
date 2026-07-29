import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { User } from '../types.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<{ verificationToken?: string }>;
  googleLogin: () => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ resetToken?: string; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lifeos_jwt'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper API fetcher with token
  const apiFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const currentToken = token || localStorage.getItem('lifeos_jwt');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('lifeos_jwt');
        setToken(null);
        setUser(null);
      }
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }, [token]);

  // Load profile on initial boot or token update
  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('lifeos_jwt');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('lifeos_jwt');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('lifeos_jwt', data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign up failed');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('lifeos_jwt', data.token);
      return { verificationToken: data.user.verificationToken };
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async () => {
    setIsLoading(true);
    try {
      const firebaseResult = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await firebaseResult.user.getIdToken();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseToken: idToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google Login failed');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('lifeos_jwt', data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('lifeos_jwt');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Forgot password failed');
    return { resetToken: data.resetToken, message: data.message };
  };

  const resetPassword = async (tokenStr: string, newPassword: string) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenStr, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
  };

  const verifyEmail = async () => {
    const data = await apiFetch('/api/auth/verify-email', { method: 'POST' });
    if (user) {
      setUser({ ...user, isEmailVerified: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        googleLogin,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail,
        refreshUser,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
