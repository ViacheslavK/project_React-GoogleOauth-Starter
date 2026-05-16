import { useAuth } from '../auth/AuthContext';

export function AuthError() {
  const { error, setError } = useAuth();

  if (!error) return null;

  return (
    <div data-testid="auth-error" role="alert" className="auth-error">
      <div className="auth-error-content">
        <span className="auth-error-icon">⚠️</span>
        <span data-testid="auth-error-message" className="auth-error-text">
          {error}
        </span>
        <button
          data-testid="auth-error-dismiss"
          onClick={() => setError(null)}
          aria-label="Dismiss error"
          className="auth-error-close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
