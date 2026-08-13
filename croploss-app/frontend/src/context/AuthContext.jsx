import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('croploss_token');
    const saved = localStorage.getItem('croploss_user');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
        // Verify token is still valid
        authAPI.me()
          .then(res => { setUser(res.data.user); localStorage.setItem('croploss_user', JSON.stringify(res.data.user)); })
          .catch(() => { localStorage.removeItem('croploss_token'); localStorage.removeItem('croploss_user'); setUser(null); })
          .finally(() => setLoading(false));
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: u } = res.data;
    localStorage.setItem('croploss_token', token);
    localStorage.setItem('croploss_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('croploss_token');
    localStorage.removeItem('croploss_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await authAPI.me();
    setUser(res.data.user);
    localStorage.setItem('croploss_user', JSON.stringify(res.data.user));
  }, []);

  // Role helpers
  const isAdmin    = user?.role === 'super_admin';
  const isCropHead = user?.role === 'crop_head';
  const isCenter   = user?.role === 'center_user';
  const canReview  = isAdmin || isCropHead;
  const canEnter   = isAdmin || isCenter;

  const hasCropAccess = useCallback((crop) => {
    if (!user) return false;
    if (isAdmin) return true;
    const all = [...(user.assignedCrops||[]), ...(user.reviewCrops||[])];
    return all.includes(crop);
  }, [user, isAdmin]);

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, refreshUser,
      isAdmin, isCropHead, isCenter, canReview, canEnter, hasCropAccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
