import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { STORAGE_KEYS } from '../constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // FIX BUG-H02: Validate the shape of restored auth data before trusting it.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.user &&
          typeof parsed.user === 'object' &&
          parsed.user.id &&
          typeof parsed.token === 'string' &&
          parsed.token.length > 0
        ) {
          setUser(parsed.user);
          setToken(parsed.token);
        } else {
          throw new Error('Invalid auth data shape');
        }
      }
    } catch (err) {
      console.error('Failed to restore auth from localStorage:', err.message);
      try {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      } catch {
        /* localStorage may be unavailable */
      }
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // FIX BUG-H03: navigate to /login when the server says our token is no longer valid.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setToken(null);
      // Use replace so the back button doesn't return to the protected page.
      navigate('/login', { replace: true });
    };
    window.addEventListener('session:expired', onExpired);
    return () => window.removeEventListener('session:expired', onExpired);
  }, [navigate]);

  const persist = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ user: nextUser, token: nextToken }));
    } catch (err) {
      console.error('Failed to persist auth to localStorage:', err.message);
    }
  }, []);

  const signup = useCallback(
    async ({ name, email, password }) => {
      setError(null);
      const res = await authService.signup({ name, email, password });
      const userData = res?.data?.data?.user || res?.data?.user;
      const authToken = res?.data?.data?.token || res?.data?.token;
      if (userData && authToken) {
        persist(userData, authToken);
        return { user: userData, token: authToken };
      }
      throw new Error('Invalid response from server');
    },
    [persist]
  );

  const login = useCallback(
    async ({ email, password }) => {
      setError(null);
      const res = await authService.login({ email, password });
      const userData = res?.data?.data?.user || res?.data?.user;
      const authToken = res?.data?.data?.token || res?.data?.token;
      if (userData && authToken) {
        persist(userData, authToken);
        return { user: userData, token: authToken };
      }
      throw new Error('Invalid response from server');
    },
    [persist]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      signup,
      login,
      logout,
      isAuthenticated: !!token && !!user,
    }),
    [user, token, loading, error, signup, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}