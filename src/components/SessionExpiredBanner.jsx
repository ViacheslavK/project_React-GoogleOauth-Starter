import { useAuth } from '../auth/AuthContext';

export function SessionExpiredBanner() {
  const { sessionExpired, setSessionExpired } = useAuth();

  if (!sessionExpired) return null;

  return (
    <div data-testid="session-expired-banner" role="alert" className="session-expired-banner">
      <div className="session-expired-content">
        <span className="session-expired-icon">🔒</span>
        <span data-testid="session-expired-message" className="session-expired-text">
          Your session has expired. Please sign in again.
        </span>
        <button
          data-testid="session-expired-dismiss"
          onClick={() => setSessionExpired(false)}
          aria-label="Dismiss session expired notice"
          className="session-expired-close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
