import { useAuth } from '../auth/AuthContext';

export function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div data-testid="user-profile" className="user-profile">
      <img
        data-testid="user-avatar"
        src={user.picture}
        alt={user.name}
        className="user-avatar"
      />
      <div className="user-info">
        <span data-testid="user-name" className="user-name">
          {user.name}
        </span>
        <span data-testid="user-email" className="user-email">
          {user.email}
        </span>
      </div>
      <button
        data-testid="logout-button"
        onClick={logout}
        aria-label="Sign out"
        className="logout-button"
      >
        Sign out
      </button>
    </div>
  );
}
