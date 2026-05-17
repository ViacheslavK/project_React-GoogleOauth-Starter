import { useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthContext';

const getApiUrl = () => {
  if (typeof process !== 'undefined' && process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  return 'http://localhost:3001';
};

export function useGoogleAuth() {
  const { login, setError, setIsLoading, setSessionExpired, needsRefresh, setNeedsRefresh } = useAuth();
  const apiUrl = getApiUrl();

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async ({ code }) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${apiUrl}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Authentication failed: ${response.status}`);
        }

        const { user, expiry_date } = await response.json();
        login(user, expiry_date || null);
      } catch (error) {
        console.error('Failed to authenticate:', error);
        setError(error.message || 'Failed to authenticate. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (err) => {
      console.error('Google login error:', err);
      setError(`Google authentication failed: ${err.error || 'Unknown error'}`);
      setIsLoading(false);
    },
  });

  // Silent refresh function for token refresh
  const silentRefresh = useGoogleLogin({
    flow: 'auth-code',
    prompt: 'none', // Don't show popup, fail silently if session expired
    onSuccess: async ({ code }) => {
      try {
        const response = await fetch(`${apiUrl}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const { user, expiry_date } = await response.json();
        login(user, expiry_date || null);
      } catch (error) {
        console.error('Silent refresh failed:', error);
        setSessionExpired(true);
        setError('Session expired. Please log in again.');
      }
    },
    onError: (err) => {
      console.error('Silent refresh error:', err);
      setSessionExpired(true);
    },
  });

  useEffect(() => {
    if (needsRefresh) {
      setNeedsRefresh(false);
      silentRefresh();
    }
  }, [needsRefresh, setNeedsRefresh, silentRefresh]);

  return { googleLogin, silentRefresh };
}
