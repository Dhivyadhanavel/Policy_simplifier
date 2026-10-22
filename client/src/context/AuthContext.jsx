// client/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Decode JWT payload without verification (verification happens server-side)
const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('lexiclear_token');
    localStorage.removeItem('lexiclear_user');
    setToken(null);
    setUser(null);
  }, []);

  // Auto-clear expired token
  useEffect(() => {
    if (!token) return;
    const decoded = decodeToken(token);
    if (!decoded?.exp) return;
    const expiresInMs = decoded.exp * 1000 - Date.now();
    if (expiresInMs <= 0) {
      logout();
      return;
    }
    const timer = setTimeout(() => {
      logout();
      window.location.href = '/login';
    }, expiresInMs);
    return () => clearTimeout(timer);
  }, [token, logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem('lexiclear_token');
    const storedUser = localStorage.getItem('lexiclear_user');
    if (storedToken && storedUser) {
      try {
        const decoded = decodeToken(storedToken);
        // Check if already expired
        if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('lexiclear_token');
          localStorage.removeItem('lexiclear_user');
        } else {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setToken(storedToken);
        }
      } catch {
        localStorage.removeItem('lexiclear_token');
        localStorage.removeItem('lexiclear_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (tokenValue, userData) => {
    localStorage.setItem('lexiclear_token', tokenValue);
    localStorage.setItem('lexiclear_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
