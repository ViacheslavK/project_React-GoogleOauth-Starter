import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthContext';

export function useGoogleAuth() {
  const { login } = useAuth();

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );
        const profile = await response.json();
        login({
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
          accessToken: tokenResponse.access_token,
        });
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    },
    onError: (err) => {
      console.error('Google login error:', err);
    },
  });

  return { googleLogin };
}
