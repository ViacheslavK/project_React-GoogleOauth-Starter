import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthContext';

const getApiUrl = () => {
  if (typeof process !== 'undefined' && process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  return 'http://localhost:3001';
};

export function useGoogleAuth() {
  const { login } = useAuth();
  const apiUrl = getApiUrl();

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async ({ code }) => {
      try {
        const response = await fetch(`${apiUrl}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error(`Auth failed: ${response.status}`);
        }

        const { user } = await response.json();
        login(user);
      } catch (error) {
        console.error('Failed to authenticate:', error);
      }
    },
    onError: (err) => {
      console.error('Google login error:', err);
    },
  });

  return { googleLogin };
}
