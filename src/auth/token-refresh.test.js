import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: jest.fn(),
  GoogleOAuthProvider: ({ children }) => children,
}));

function TestComponent() {
  const { login, needsRefresh, setNeedsRefresh } = useAuth();
  return (
    <div>
      <button
        data-testid="login-btn"
        onClick={() => login({ name: 'Test', email: 'test@example.com', picture: 'pic' }, Date.now() + 3_600_000)}
      >
        Login (1hr expiry)
      </button>
      <button
        data-testid="login-no-expiry-btn"
        onClick={() => login({ name: 'Test', email: 'test@example.com', picture: 'pic' })}
      >
        Login (no expiry)
      </button>
      <button
        data-testid="clear-refresh-btn"
        onClick={() => setNeedsRefresh(false)}
      >
        Clear Needs Refresh
      </button>
      <div data-testid="needs-refresh-status">{needsRefresh ? 'NEEDS_REFRESH' : 'OK'}</div>
    </div>
  );
}

describe('Token refresh timer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: null, expiry_date: null }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('schedules refresh 60s before token expiry', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    act(() => {
      loginBtn.click();
    });

    // Timer fires at 59 minutes (60s before 1hr expiry), so test before it fires
    act(() => {
      jest.advanceTimersByTime(58 * 60 * 1000); // 58 minutes
    });

    await waitFor(() => {
      expect(screen.getByTestId('needs-refresh-status')).toHaveTextContent('OK');
    });

    // Advance past the firing point (needs to go past 59 minutes)
    act(() => {
      jest.advanceTimersByTime(2 * 60 * 1000); // +2 min = 60 min total, past 59 min threshold
    });

    await waitFor(() => {
      expect(screen.getByTestId('needs-refresh-status')).toHaveTextContent('NEEDS_REFRESH');
    });
  });

  test('does not schedule refresh when expiry_date is null', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-no-expiry-btn');
    act(() => {
      loginBtn.click();
    });

    // Advance timers well past any reasonable timeout
    act(() => {
      jest.advanceTimersByTime(2 * 60 * 60 * 1000); // 2 hours
    });

    // needsRefresh should remain false
    expect(screen.getByTestId('needs-refresh-status')).toHaveTextContent('OK');
  });

  test('clears existing timer when login is called again before expiry', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');

    // First login with expiry in 1 hour
    act(() => {
      loginBtn.click();
    });

    // Advance to 45 minutes
    act(() => {
      jest.advanceTimersByTime(45 * 60 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('needs-refresh-status')).toHaveTextContent('OK');
    });

    // Login again with expiry in 1 hour (resets the timer)
    act(() => {
      loginBtn.click();
    });

    // Advance another 45 minutes (total would be 90, but timer was reset so we're at 45 into new timer)
    act(() => {
      jest.advanceTimersByTime(45 * 60 * 1000);
    });

    // Old timer would have fired at 60min from first login (45 already passed + 15 more = 60)
    // But we reset it, so we should be at 45min of new timer, which is before the 60min threshold
    await waitFor(() => {
      expect(screen.getByTestId('needs-refresh-status')).toHaveTextContent('OK');
    });

    // Now advance enough to hit the new timer (need 15 more minutes to reach 60 from second login)
    act(() => {
      jest.advanceTimersByTime(20 * 60 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('needs-refresh-status')).toHaveTextContent('NEEDS_REFRESH');
    });
  });

  test('needsRefresh resets to false after setNeedsRefresh is called', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    act(() => {
      loginBtn.click();
    });

    // Trigger refresh by advancing timer
    act(() => {
      jest.advanceTimersByTime(61 * 60 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('needs-refresh-status')).toHaveTextContent('NEEDS_REFRESH');
    });

    // Clear the refresh flag
    const clearBtn = screen.getByTestId('clear-refresh-btn');
    act(() => {
      clearBtn.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('needs-refresh-status')).toHaveTextContent('OK');
    });
  });
});
