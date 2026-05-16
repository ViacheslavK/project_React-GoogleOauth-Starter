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
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ user: null }),
  });

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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when not logged in', async () => {
    renderUserProfile(null);
    await waitFor(() => {
      expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument();
    });
  });

  test('renders user profile when logged in', async () => {
    renderUserProfile(mockUser);
    await waitFor(() => {
      expect(screen.getByTestId('user-profile')).toBeInTheDocument();
    });
  });

  test('displays user name', async () => {
    renderUserProfile(mockUser);
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Ada Lovelace');
    });
  });

  test('displays user email', async () => {
    renderUserProfile(mockUser);
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('ada@example.com');
    });
  });

  test('displays user avatar with correct src', async () => {
    renderUserProfile(mockUser);
    await waitFor(() => {
      const avatar = screen.getByTestId('user-avatar');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(avatar).toHaveAttribute('alt', 'Ada Lovelace');
    });
  });

  test('logout button exists', async () => {
    renderUserProfile(mockUser);
    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });
  });

  test('logout button has correct aria-label', async () => {
    renderUserProfile(mockUser);
    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toHaveAttribute('aria-label', 'Sign out');
    });
  });

  test('logout button is interactive when user is logged in', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderUserProfile(mockUser);
    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });

    const logoutBtn = screen.getByTestId('logout-button');
    expect(logoutBtn).toHaveTextContent('Sign out');

    expect(() => fireEvent.click(logoutBtn)).not.toThrow();
  });
});
