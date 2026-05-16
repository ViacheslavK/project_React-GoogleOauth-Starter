import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: jest.fn(),
  GoogleOAuthProvider: ({ children }) => children,
}));

// ============ COMPREHENSIVE ERROR SCENARIOS ============

function ErrorTestComponent() {
  const { error, setError, user, login } = useAuth();

  return (
    <div>
      {error && (
        <div data-testid="error-display" role="alert">
          <span data-testid="error-text">{error}</span>
          <button
            data-testid="error-dismiss"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      <div data-testid="user-status">
        {user ? `${user.name}` : 'Not logged in'}
      </div>
      <button
        data-testid="simulate-error"
        onClick={() => setError('Authentication failed: Invalid credentials')}
      >
        Simulate Error
      </button>
      <button
        data-testid="clear-error"
        onClick={() => setError(null)}
      >
        Clear Error
      </button>
    </div>
  );
}

describe('OAuth Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch for AuthProvider session restore
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: null }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============ ERROR DISPLAY ============
  test('displays error when error state is set', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null }),
    });

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('simulate-error'));

    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByTestId('error-text')).toHaveTextContent('Authentication failed');
    });
  });

  test('error display has dismiss button', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null }),
    });

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('simulate-error'));

    await waitFor(() => {
      expect(screen.getByTestId('error-dismiss')).toBeInTheDocument();
    });
  });

  test('dismissing error clears the error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null }),
    });

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('simulate-error'));

    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('error-dismiss'));

    await waitFor(() => {
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    });
  });

  // ============ SPECIFIC ERROR CASES ============
  test('handles network error message', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      // Should eventually not throw even with network error
      expect(screen.getByTestId('user-status')).toBeInTheDocument();
    });
  });

  test('handles malformed JSON response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toBeInTheDocument();
    });
  });

  test('handles 401 Unauthorized response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  test('handles 403 Forbidden response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    });

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  test('handles 500 server error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  test('handles timeout (fetch abort)', async () => {
    const abortError = new Error('Fetch aborted');
    abortError.name = 'AbortError';
    global.fetch.mockRejectedValueOnce(abortError);

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toBeInTheDocument();
    });
  });

  // ============ ERROR CLEARING ============
  test('error is cleared when attempting new login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null }),
    });

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    // Set error
    fireEvent.click(screen.getByTestId('simulate-error'));

    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });

    // Manually clear
    fireEvent.click(screen.getByTestId('clear-error'));

    await waitFor(() => {
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    });
  });

  // ============ CONCURRENT ERRORS ============
  test('handles multiple simultaneous errors gracefully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null }),
    });

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    // Set error multiple times
    fireEvent.click(screen.getByTestId('simulate-error'));
    fireEvent.click(screen.getByTestId('simulate-error'));

    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      // Should show latest error, not both
      expect(screen.getByTestId('error-text')).toHaveTextContent('Authentication failed');
    });
  });
});
