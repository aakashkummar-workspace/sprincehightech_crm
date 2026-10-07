import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

// Roles that get full-company read access (per plan Part 2).
export const MANAGEMENT_ROLES = ['director', 'regional_head'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('sprince_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('sprince_token', data.token);
    localStorage.setItem('sprince_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sprince_token');
    localStorage.removeItem('sprince_user');
    setUser(null);
  }, []);

  const isManagement = user ? MANAGEMENT_ROLES.includes(user.role) : false;

  return (
    <AuthContext.Provider value={{ user, login, logout, isManagement }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
