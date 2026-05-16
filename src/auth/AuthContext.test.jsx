import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

function TestConsumer() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="user-status">
        {user ? `${user.name} (${user.email})` : 'Not logged in'}
      </div>
      <button
        data-testid="login-test-btn"
        onClick={() =>
          login({ name: 'Test User', email: 'test@example.com', picture: 'pic.jpg' })
        }
      >
        Login
      </button>
      <button data-testid="logout-test-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('starts with no user', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  test('login sets user', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });

    fireEvent.click(screen.getByTestId('login-test-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Test User (test@example.com)');
    });
  });

  test('logout clears user and calls backend', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });

    fireEvent.click(screen.getByTestId('login-test-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Test User');
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    fireEvent.click(screen.getByTestId('logout-test-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/logout'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('useAuth throws outside AuthProvider', () => {
    function ComponentWithoutProvider() {
      useAuth();
      return null;
    }

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<ComponentWithoutProvider />);
    }).toThrow('useAuth must be used within AuthProvider');

    consoleError.mockRestore();
  });
});
