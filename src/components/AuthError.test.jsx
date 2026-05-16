import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthError } from './AuthError';
import { AuthProvider, useAuth } from '../auth/AuthContext';

jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: jest.fn(),
  GoogleOAuthProvider: ({ children }) => children,
}));

function TestWrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function ErrorSetter() {
  const { setError } = useAuth();
  return (
    <div>
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

describe('AuthError Component', () => {
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

  test('renders nothing when error is null', async () => {
    render(
      <TestWrapper>
        <AuthError />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('auth-error')).not.toBeInTheDocument();
    });
  });

  test('renders error message when error is set', async () => {
    render(
      <TestWrapper>
        <AuthError />
        <ErrorSetter />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-error-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-error')).toBeInTheDocument();
      expect(screen.getByTestId('auth-error-message')).toHaveTextContent(
        'Test error message'
      );
    });
  });

  test('has dismiss button', async () => {
    render(
      <TestWrapper>
        <AuthError />
        <ErrorSetter />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-error-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-error-dismiss')).toBeInTheDocument();
    });
  });

  test('dismiss button clears error', async () => {
    render(
      <TestWrapper>
        <AuthError />
        <ErrorSetter />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-error-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('auth-error-dismiss'));

    await waitFor(() => {
      expect(screen.queryByTestId('auth-error')).not.toBeInTheDocument();
    });
  });

  test('has correct aria-label on dismiss button', async () => {
    render(
      <TestWrapper>
        <AuthError />
        <ErrorSetter />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-error-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-error-dismiss')).toHaveAttribute(
        'aria-label',
        'Dismiss error'
      );
    });
  });

  test('has role="alert" for accessibility', async () => {
    render(
      <TestWrapper>
        <AuthError />
        <ErrorSetter />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-error-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-error')).toHaveAttribute('role', 'alert');
    });
  });
});
