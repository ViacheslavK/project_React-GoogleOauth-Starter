import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

function TestConsumer() {
  const { user, login, logout, error, setError, isLoading } = useAuth();
  return (
    <div>
      <div data-testid="user-status">
        {user ? `${user.name} (${user.email})` : 'Not logged in'}
      </div>
      <div data-testid="error-status">{error || 'No error'}</div>
      <div data-testid="loading-status">{isLoading ? 'Loading' : 'Not loading'}</div>
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
      <button
        data-testid="set-error-btn"
        onClick={() => setError('Test error message')}
      >
        Set Error
      </button>
      <button
        data-testid="clear-error-btn"
        onClick={() => setError(null)}
      >
        Clear Error
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

  // ============ ERROR STATE TESTS ============
  test('error state starts as null', async () => {
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
      expect(screen.getByTestId('error-status')).toHaveTextContent('No error');
    });
  });

  test('setError sets error message', async () => {
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
      expect(screen.getByTestId('error-status')).toHaveTextContent('No error');
    });

    fireEvent.click(screen.getByTestId('set-error-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('error-status')).toHaveTextContent('Test error message');
    });
  });

  test('setError(null) clears error', async () => {
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
      expect(screen.getByTestId('error-status')).toHaveTextContent('No error');
    });

    fireEvent.click(screen.getByTestId('set-error-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('error-status')).toHaveTextContent('Test error message');
    });

    fireEvent.click(screen.getByTestId('clear-error-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('error-status')).toHaveTextContent('No error');
    });
  });

  // ============ LOADING STATE TESTS ============
  test('isLoading state exists and can be checked', async () => {
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
      expect(screen.getByTestId('loading-status')).toBeInTheDocument();
    });
  });

  // ============ SESSION RESTORE ERROR HANDLING ============
  test('handles session restore network error gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  test('handles session restore bad response (not ok)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
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

  test('restores user session if available', async () => {
    const mockSessionUser = {
      name: 'Session User',
      email: 'session@example.com',
      picture: 'https://example.com/session.jpg',
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockSessionUser }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Session User (session@example.com)');
    });
  });

  // ============ LOGOUT ERROR HANDLING ============
  test('logout handles backend error but still clears user', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('login-test-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Test User');
    });

    // Logout fails on backend but should still clear user
    global.fetch.mockRejectedValueOnce(new Error('Backend error'));

    fireEvent.click(screen.getByTestId('logout-test-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  // ============ SESSION EXPIRY STATE ============
  test('sessionExpired starts as false', async () => {
    function ExpiryStatusComponent() {
      const { sessionExpired } = useAuth();
      return <div data-testid="expiry-status">{sessionExpired ? 'EXPIRED' : 'VALID'}</div>;
    }

    render(
      <AuthProvider>
        <ExpiryStatusComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expiry-status')).toHaveTextContent('VALID');
    });
  });

  test('setSessionExpired(true) sets the flag', async () => {
    function ExpiryToggleComponent() {
      const { sessionExpired, setSessionExpired } = useAuth();
      return (
        <div>
          <div data-testid="expiry-status">{sessionExpired ? 'EXPIRED' : 'VALID'}</div>
          <button data-testid="set-expired-btn" onClick={() => setSessionExpired(true)}>
            Set Expired
          </button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <ExpiryToggleComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('set-expired-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('expiry-status')).toHaveTextContent('EXPIRED');
    });
  });

  test('login() resets sessionExpired to false', async () => {
    function ExpiryLoginComponent() {
      const { sessionExpired, setSessionExpired, login } = useAuth();
      return (
        <div>
          <div data-testid="expiry-status">{sessionExpired ? 'EXPIRED' : 'VALID'}</div>
          <button data-testid="set-expired-btn" onClick={() => setSessionExpired(true)}>
            Set Expired
          </button>
          <button
            data-testid="login-expired-btn"
            onClick={() => login({ name: 'Test', email: 'test@example.com', picture: 'pic' })}
          >
            Login
          </button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <ExpiryLoginComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('set-expired-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('expiry-status')).toHaveTextContent('EXPIRED');
    });

    fireEvent.click(screen.getByTestId('login-expired-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('expiry-status')).toHaveTextContent('VALID');
    });
  });

  test('logout() resets sessionExpired to false', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null, expiry_date: null }),
    });

    function ExpiryLogoutComponent() {
      const { user, sessionExpired, setSessionExpired, login, logout } = useAuth();
      return (
        <div>
          <div data-testid="expiry-status">{sessionExpired ? 'EXPIRED' : 'VALID'}</div>
          <button
            data-testid="login-logout-btn"
            onClick={() => login({ name: 'Test', email: 'test@example.com', picture: 'pic' })}
          >
            Login
          </button>
          <button
            data-testid="set-expired-logout-btn"
            onClick={() => setSessionExpired(true)}
          >
            Set Expired
          </button>
          <button
            data-testid="logout-expiry-btn"
            onClick={logout}
            disabled={!user}
          >
            Logout
          </button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <ExpiryLogoutComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('login-logout-btn'));
    await waitFor(() => {
      // User should be logged in
    });

    fireEvent.click(screen.getByTestId('set-expired-logout-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('expiry-status')).toHaveTextContent('EXPIRED');
    });

    fireEvent.click(screen.getByTestId('logout-expiry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('expiry-status')).toHaveTextContent('VALID');
    });
  });
});
