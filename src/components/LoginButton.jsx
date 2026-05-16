import { useAuth } from '../auth/AuthContext';
import { useGoogleAuth } from '../auth/useGoogleAuth';

export function LoginButton() {
  const { user } = useAuth();
  const { googleLogin } = useGoogleAuth();

  if (user) return null;

  return (
    <button
      onClick={() => googleLogin()}
      data-testid="login-button"
      aria-label="Sign in with Google"
      className="login-button"
    >
      Sign in with Google
    </button>
  );
}
