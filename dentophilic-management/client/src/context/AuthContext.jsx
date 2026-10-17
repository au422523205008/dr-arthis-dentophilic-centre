import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // Clear legacy localStorage from prior sessions
      localStorage.removeItem('dentophilic_user');
      localStorage.removeItem('dentophilic_token');
      const saved = sessionStorage.getItem('dentophilic_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [hasAdmin, setHasAdmin] = useState(null); // null = unknown, true = admin exists, false = first run needed
  const [isLoading, setIsLoading] = useState(true);

  // Check setup status and existing login session on mount
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      // 1. Check if first-run setup is needed
      const setupRes = await api.get('/auth/setup-status');
      setHasAdmin(setupRes.hasAdmin);

      if (!setupRes.hasAdmin) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // 2. If token exists in this tab session, verify current session
      const token = sessionStorage.getItem('dentophilic_token');
      if (token) {
        try {
          const meRes = await api.get('/auth/me');
          if (meRes.success && meRes.user) {
            setUser(meRes.user);
            sessionStorage.setItem('dentophilic_user', JSON.stringify(meRes.user));
          } else {
            setUser(null);
            sessionStorage.removeItem('dentophilic_token');
            sessionStorage.removeItem('dentophilic_user');
          }
        } catch (err) {
          setUser(null);
          sessionStorage.removeItem('dentophilic_token');
          sessionStorage.removeItem('dentophilic_user');
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Session initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();

    // Listen for auth expired events
    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [checkSession]);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.success && res.user && res.token) {
      sessionStorage.setItem('dentophilic_token', res.token);
      sessionStorage.setItem('dentophilic_user', JSON.stringify(res.user));
      // Ensure legacy persistent localStorage is cleaned
      localStorage.removeItem('dentophilic_token');
      localStorage.removeItem('dentophilic_user');
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const setupFirstAdmin = async (payload) => {
    const res = await api.post('/auth/setup-admin', payload);
    if (res.success && res.user && res.token) {
      sessionStorage.setItem('dentophilic_token', res.token);
      sessionStorage.setItem('dentophilic_user', JSON.stringify(res.user));
      localStorage.removeItem('dentophilic_token');
      localStorage.removeItem('dentophilic_user');
      setUser(res.user);
      setHasAdmin(true);
      return res.user;
    }
    throw new Error(res.message || 'Setup failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore network errors on logout
    }
    sessionStorage.removeItem('dentophilic_token');
    sessionStorage.removeItem('dentophilic_user');
    localStorage.removeItem('dentophilic_token');
    localStorage.removeItem('dentophilic_user');
    setUser(null);
  };

  // Helper to check granular permissions
  const hasPermission = (permissionKey) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (!user.permissions) return false;
    return !!user.permissions[permissionKey];
  };

  const isAdmin = user?.role === 'ADMIN';
  const isAttender = user?.role === 'ATTENDER';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        isAdmin,
        isAttender,
        isAuthenticated: !!user,
        isLoading,
        hasAdmin,
        hasPermission,
        login,
        setupFirstAdmin,
        logout,
        refreshUser: checkSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
