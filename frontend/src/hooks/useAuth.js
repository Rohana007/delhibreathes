import { useState, useEffect } from 'react';
import { getMe } from '../services/api';

/**
 * useAuth Hook
 * Provides authentication state and user information using JWT
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');

      if (authToken) {
        // Try to validate token with backend
        try {
          const result = await getMe();
          if (result.success && result.user) {
            setUser(result.user);
            setToken(authToken);
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(result.user));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
          }
        } catch (error) {
          // If validation fails, try to use cached user data
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              setUser(parsedUser);
              setToken(authToken);
            } catch (e) {
              // Invalid cached data, clear storage
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              setUser(null);
              setToken(null);
            }
          } else {
            localStorage.removeItem('authToken');
            setUser(null);
            setToken(null);
          }
        }
      } else {
        // No token, clear user data
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // Listen for storage changes (for logout/login from other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'user') {
        const authToken = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');

        if (authToken && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setToken(authToken);
          } catch (e) {
            setUser(null);
            setToken(null);
          }
        } else {
          setUser(null);
          setToken(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { user, token, loading };
}
