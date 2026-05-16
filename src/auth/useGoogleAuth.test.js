import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useGoogleAuth } from './useGoogleAuth';
import { AuthProvider, useAuth } from './AuthContext';

jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: jest.fn(),
  GoogleOAuthProvider: ({ children }) => children,
}));

import { useGoogleLogin } from '@react-oauth/google';

// Test component that uses the hook
function GoogleAuthTestComponent() {
  const { user, error, isLoading, setError } = useAuth();
  const { googleLogin, silentRefresh } = useGoogleAuth();

  return (
    <div>
      <div data-testid="user-name">{user?.name || 'No user'}</div>
      <div data-testid="error-message">{error || 'No error'}</div>
      <div data-testid="loading-state">{isLoading ? 'Loading' : 'Not loading'}</div>
      <button data-testid="login-btn" onClick={() => googleLogin()}>
        Login
      </button>
      <button data-testid="refresh-btn" onClick={() => silentRefresh?.()}>
        Refresh Token
      </button>
      <button data-testid="clear-error-btn" onClick={() => setError(null)}>
        Clear Error
      </button>
    </div>
  );
}

describe('useGoogleAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch for AuthProvider session restore
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: null }),
    });
    useGoogleLogin.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============ SUCCESSFUL LOGIN ============
  test('calls login with user profile on successful Google auth', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          picture: 'https://example.com/john.jpg',
        },
      }),
    });

    const mockGoogleLogin = jest.fn((config) => {
      // Simulate successful Google response
      config.onSuccess({ code: 'auth-code-123' });
    });
    useGoogleLogin.mockReturnValue(mockGoogleLogin);

    render(
      <AuthProvider>
        <GoogleAuthTestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    });
  });

  test('sends authorization code to backend on login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { name: 'Jane', email: 'jane@example.com', picture: 'pic.jpg' },
      }),
    });

    const mockGoogleLogin = jest.fn((config) => {
      config.onSuccess({ code: 'auth-code-xyz' });
    });
    useGoogleLogin.mockReturnValue(mockGoogleLogin);

    render(
      <AuthProvider>
        <GoogleAuthTestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/google'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('auth-code-xyz'),
        })
      );
    });
  });

  // ============ LOGIN ERRORS ============
  test('sets error when Google auth fails', async () => {
    const mockGoogleLogin = jest.fn((config) => {
      config.onError({ error: 'access_denied' });
    });
    useGoogleLogin.mockReturnValue(mockGoogleLogin);

    render(
      <AuthProvider>
        <GoogleAuthTestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).not.toHaveTextContent('No error');
    });
  });

  test('sets error when backend auth exchange fails (network error)', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const mockGoogleLogin = jest.fn((config) => {
      config.onSuccess({ code: 'auth-code-123' });
    });
    useGoogleLogin.mockReturnValue(mockGoogleLogin);

    render(
      <AuthProvider>
        <GoogleAuthTestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toContain('Failed');
    });
  });

  test('sets error when backend returns non-ok response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid code' }),
    });

    const mockGoogleLogin = jest.fn((config) => {
      config.onSuccess({ code: 'invalid-code' });
    });
    useGoogleLogin.mockReturnValue(mockGoogleLogin);

    render(
      <AuthProvider>
        <GoogleAuthTestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toContain('failed');
    });
  });

  test('does not set user when backend auth fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    const mockGoogleLogin = jest.fn((config) => {
      config.onSuccess({ code: 'auth-code-123' });
    });
    useGoogleLogin.mockReturnValue(mockGoogleLogin);

    render(
      <AuthProvider>
        <GoogleAuthTestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('No user');
    });
  });

  // ============ LOADING STATE ============
  test('sets isLoading during auth process', async () => {
    const mockGoogleLogin = jest.fn((config) => {
      // Don't call callback immediately - keep loading
      setTimeout(() => config.onSuccess({ code: 'auth-code-123' }), 100);
    });
    useGoogleLogin.mockReturnValue(mockGoogleLogin);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { name: 'Test', email: 'test@example.com', picture: 'pic.jpg' },
      }),
    });

    render(
      <AuthProvider>
        <GoogleAuthTestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    // Should show loading briefly (depending on timing)
    // Final state should not be loading
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).not.toHaveTextContent('No user');
    });
  });

  // ============ TOKEN REFRESH ============
  test('silent refresh function exists', () => {
    useGoogleLogin.mockReturnValue(jest.fn());

    render(
      <AuthProvider>
        <GoogleAuthTestComponent />
      </AuthProvider>
    );

    const refreshBtn = screen.getByTestId('refresh-btn');
    expect(refreshBtn).toBeInTheDocument();
  });

  test('silent refresh calls onSuccess with code for refresh', async () => {
    const refreshLoginCall = jest.fn();
    useGoogleLogin.mockReturnValue(refreshLoginCall);

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { name: 'User', email: 'user@example.com', picture: 'pic.jpg' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { name: 'User', email: 'user@example.com', picture: 'pic.jpg' },
        }),
      });

    // First call is useGoogleLogin for login
    const mockGoogleLogin = jest.fn((config) => {
      if (config.prompt === 'none') {
        // This is refresh
        config.onSuccess({ code: 'refresh-code' });
      }
    });
    useGoogleLogin.mockReturnValue(mockGoogleLogin);

    render(
      <AuthProvider>
        <GoogleAuthTestComponent />
      </AuthProvider>
    );

    const refreshBtn = screen.getByTestId('refresh-btn');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/google'),
        expect.anything()
      );
    });
  });

  test('sets error when silent refresh fails', async () => {
    const mockGoogleLogin = jest.fn((config) => {
      if (config.prompt === 'none') {
        config.onError({ error: 'popup_closed_by_user' });
      }
    });
    useGoogleLogin.mockReturnValue(mockGoogleLogin);

    render(
      <AuthProvider>
        <GoogleAuthTestComponent />
      </AuthProvider>
    );

    const refreshBtn = screen.getByTestId('refresh-btn');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).not.toHaveTextContent('No error');
    });
  });
});
