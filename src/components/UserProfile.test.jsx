import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from './UserProfile';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { useEffect } from 'react';

function LoggedInSetupWrapper({ user, children }) {
  const { login } = useAuth();
  useEffect(() => {
    if (user) {
      login(user);
    }
  }, []);
  return children;
}

function renderUserProfile(user = null) {
  return render(
    <AuthProvider>
      <LoggedInSetupWrapper user={user}>
        <UserProfile />
      </LoggedInSetupWrapper>
    </AuthProvider>
  );
}

describe('UserProfile', () => {
  const mockUser = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    picture: 'https://example.com/avatar.jpg',
    accessToken: 'token123',
  };

  test('renders nothing when not logged in', () => {
    renderUserProfile(null);
    expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument();
  });

  test('renders user profile when logged in', () => {
    renderUserProfile(mockUser);
    expect(screen.getByTestId('user-profile')).toBeInTheDocument();
  });

  test('displays user name', () => {
    renderUserProfile(mockUser);
    expect(screen.getByTestId('user-name')).toHaveTextContent('Ada Lovelace');
  });

  test('displays user email', () => {
    renderUserProfile(mockUser);
    expect(screen.getByTestId('user-email')).toHaveTextContent('ada@example.com');
  });

  test('displays user avatar with correct src', () => {
    renderUserProfile(mockUser);
    const avatar = screen.getByTestId('user-avatar');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(avatar).toHaveAttribute('alt', 'Ada Lovelace');
  });

  test('logout button exists', () => {
    renderUserProfile(mockUser);
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });

  test('logout button has correct aria-label', () => {
    renderUserProfile(mockUser);
    expect(screen.getByTestId('logout-button')).toHaveAttribute('aria-label', 'Sign out');
  });

  test('logout button is interactive when user is logged in', () => {
    renderUserProfile(mockUser);
    const logoutBtn = screen.getByTestId('logout-button');

    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn).toHaveTextContent('Sign out');

    // Test that button is clickable (doesn't throw)
    expect(() => fireEvent.click(logoutBtn)).not.toThrow();
  });
});
