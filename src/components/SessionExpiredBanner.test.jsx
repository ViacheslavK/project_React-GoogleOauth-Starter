import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionExpiredBanner } from './SessionExpiredBanner';
import { AuthProvider, useAuth } from '../auth/AuthContext';

jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: jest.fn(),
  GoogleOAuthProvider: ({ children }) => children,
}));

function TestWrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function ExpiryTrigger() {
  const { setSessionExpired } = useAuth();
  return (
    <div>
      <button
        data-testid="set-expiry-btn"
        onClick={() => setSessionExpired(true)}
      >
        Set Session Expired
      </button>
      <button
        data-testid="clear-expiry-btn"
        onClick={() => setSessionExpired(false)}
      >
        Clear Session Expired
      </button>
    </div>
  );
}

describe('SessionExpiredBanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch for AuthProvider session restore
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: null, expiry_date: null }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders nothing when sessionExpired is false', async () => {
    render(
      <TestWrapper>
        <SessionExpiredBanner />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('session-expired-banner')).not.toBeInTheDocument();
    });
  });

  test('renders banner message when sessionExpired is true', async () => {
    render(
      <TestWrapper>
        <SessionExpiredBanner />
        <ExpiryTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-expiry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('session-expired-banner')).toBeInTheDocument();
      expect(screen.getByTestId('session-expired-message')).toHaveTextContent(
        'Your session has expired. Please sign in again.'
      );
    });
  });

  test('has dismiss button', async () => {
    render(
      <TestWrapper>
        <SessionExpiredBanner />
        <ExpiryTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-expiry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('session-expired-dismiss')).toBeInTheDocument();
    });
  });

  test('dismiss button sets sessionExpired to false', async () => {
    render(
      <TestWrapper>
        <SessionExpiredBanner />
        <ExpiryTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-expiry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('session-expired-banner')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('session-expired-dismiss'));

    await waitFor(() => {
      expect(screen.queryByTestId('session-expired-banner')).not.toBeInTheDocument();
    });
  });

  test('has role="alert" for accessibility', async () => {
    render(
      <TestWrapper>
        <SessionExpiredBanner />
        <ExpiryTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-expiry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('session-expired-banner')).toHaveAttribute('role', 'alert');
    });
  });

  test('has correct aria-label on dismiss button', async () => {
    render(
      <TestWrapper>
        <SessionExpiredBanner />
        <ExpiryTrigger />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-expiry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('session-expired-dismiss')).toHaveAttribute(
        'aria-label',
        'Dismiss session expired notice'
      );
    });
  });
});
