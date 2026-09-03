'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { insforge } from './insforge';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null; requireEmailVerification?: boolean }>;
  sendEmailOtp: (email: string) => Promise<{ error: string | null; message?: string }>;
  verifyEmailOtp: (email: string, otp: string, name?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: 'Auth not initialized' }),
  signUp: async () => ({ error: 'Auth not initialized' }),
  sendEmailOtp: async () => ({ error: 'Auth not initialized' }),
  verifyEmailOtp: async () => ({ error: 'Auth not initialized' }),
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserFromSession = useCallback((rawUser: any) => {
    if (!rawUser) {
      setUser(null);
      return;
    }
    setUser({
      id: rawUser.id,
      email: rawUser.email,
      name: rawUser.profile?.name || rawUser.name || rawUser.email?.split('@')[0] || 'Hopper',
      avatar_url: rawUser.profile?.avatar_url || null,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data, error } = await insforge.auth.getCurrentUser();
      if (!error && data?.user) {
        syncUserFromSession(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [syncUserFromSession]);

  useEffect(() => {
    refreshUser();

    // Subscribe to auth state transitions
    const unsubscribe = insforge.auth.onAuthStateChange(event => {
      if (event === 'signedOut') {
        setUser(null);
        setLoading(false);
      } else {
        refreshUser();
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [refreshUser, syncUserFromSession]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await insforge.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message || 'Invalid credentials' };
      }

      if (data?.user) {
        syncUserFromSession(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign in' };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { error } = await insforge.auth.signUp({
        email: email.trim(),
        password,
        name: name?.trim() || undefined,
      });

      if (error) {
        return { error: error.message || 'Failed to create account' };
      }

      // Automatically sign in to establish session
      const { data: signInData, error: signInError } = await insforge.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        return { error: signInError.message };
      }

      if (signInData?.user) {
        syncUserFromSession(signInData.user);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Registration failed' };
    }
  };

  const sendEmailOtp = async (email: string) => {
    try {
      const { data, error } = await insforge.auth.signInWithOtp({
        email: email.trim(),
      });

      if (error) {
        return { error: error.message || 'Failed to send OTP code' };
      }

      return {
        error: null,
        message: data?.message || 'Verification code sent to your email!',
      };
    } catch (err: any) {
      return { error: err?.message || 'Failed to send OTP code' };
    }
  };

  const verifyEmailOtp = async (email: string, otp: string, name?: string) => {
    try {
      const { data, error } = await insforge.auth.verifyOtp({
        email: email.trim(),
        otp: otp.trim(),
        name: name?.trim() || undefined,
      });

      if (error) {
        return { error: error.message || 'Invalid or expired verification code' };
      }

      if (data?.user) {
        syncUserFromSession(data.user);
      } else {
        await refreshUser();
      }

      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Verification failed' };
    }
  };

  const signOut = async () => {
    try {
      await insforge.auth.signOut();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        sendEmailOtp,
        verifyEmailOtp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
