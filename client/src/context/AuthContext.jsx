import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/services';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('csms_token');
    const stored = localStorage.getItem('csms_user');
    if (token && stored) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    if (data.success) {
      const token = data.data.token;
      const userData = data.data.user;
      // Ensure memberId is mapped for member-role users
      if (!userData.memberId) {
        userData.memberId = data.data?.user?.memberId || data.data?.memberId || null;
      }
      localStorage.setItem('csms_token', token);
      localStorage.setItem('csms_user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      return userData;
    }
    throw new Error(data.message || 'Login failed');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('csms_token');
    localStorage.removeItem('csms_user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('csms_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
