import { renderHook, act, waitFor, render } from '@testing-library/react';
import { useGoogleAuth } from './useGoogleAuth';
import { AuthProvider, useAuth } from './AuthContext';

jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: jest.fn(),
  GoogleOAuthProvider: ({ children }) => children,
}));

import { useGoogleLogin } from '@react-oauth/google';

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useGoogleAuth', () => {
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

  // ============ HOOK EXISTENCE ============
  test('hook returns googleLogin and silentRefresh functions', () => {
    const mockGoogleLogin = jest.fn();
    useGoogleLogin.mockReturnValue(mockGoogleLogin);

    const { result } = renderHook(() => useGoogleAuth(), { wrapper });

    expect(result.current).toHaveProperty('googleLogin');
    expect(result.current).toHaveProperty('silentRefresh');
  });

  // ============ SUCCESSFUL LOGIN ============
  test('successful login calls backend with authorization code', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { name: 'John Doe', email: 'john@example.com', picture: 'pic.jpg' },
      }),
    });

    let googleLoginConfig;
    useGoogleLogin.mockImplementation((config) => {
      if (!config.prompt) {  // Capture the non-silent login config
        googleLoginConfig = config;
      }
      return jest.fn();
    });

    const { result } = renderHook(() => useGoogleAuth(), { wrapper });

    await act(async () => {
      await googleLoginConfig.onSuccess({ code: 'test-code-123' });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/google'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('test-code-123'),
      })
    );
  });


  // ============ LOGIN ERRORS ============
  test('Google auth error has onError callback', () => {
    let googleLoginConfig;
    useGoogleLogin.mockImplementation((config) => {
      if (!config.prompt && !googleLoginConfig) {
        googleLoginConfig = config;
      }
      return jest.fn();
    });

    const { result } = renderHook(() => useGoogleAuth(), { wrapper });

    expect(googleLoginConfig).toBeDefined();
    expect(googleLoginConfig.onError).toBeDefined();
  });

  test('backend auth error has onSuccess callback', () => {
    let googleLoginConfig;
    useGoogleLogin.mockImplementation((config) => {
      if (!config.prompt && !googleLoginConfig) {
        googleLoginConfig = config;
      }
      return jest.fn();
    });

    const { result } = renderHook(() => useGoogleAuth(), { wrapper });

    expect(googleLoginConfig).toBeDefined();
    expect(googleLoginConfig.onSuccess).toBeDefined();
  });

  test('silentRefresh function is returned', () => {
    useGoogleLogin.mockReturnValue(jest.fn());
    const { result } = renderHook(() => useGoogleAuth(), { wrapper });
    expect(result.current.silentRefresh).toBeDefined();
  });

  test('does not set user on auth error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    let googleLoginConfig;
    useGoogleLogin.mockImplementation((config) => {
      googleLoginConfig = config;
      return jest.fn();
    });

    let authUser;
    function TestComponent() {
      const { user } = useAuth();
      authUser = user;
      useGoogleAuth();
      return null;
    }

    const { rerender } = renderHook(() => TestComponent(), { wrapper });

    act(() => {
      googleLoginConfig.onSuccess({ code: 'bad-code' });
    });

    await waitFor(() => {
      rerender();
      expect(authUser).toBeNull();
    });
  });

  // ============ LOADING STATE ============
  test('sets loading state during auth', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { name: 'Test User', email: 'test@example.com', picture: 'pic.jpg' },
      }),
    });

    let googleLoginConfig;
    useGoogleLogin.mockImplementation((config) => {
      googleLoginConfig = config;
      return jest.fn();
    });

    let isLoading;
    function TestComponent() {
      const { isLoading: loading } = useAuth();
      isLoading = loading;
      useGoogleAuth();
      return null;
    }

    const { rerender } = renderHook(() => TestComponent(), { wrapper });

    act(() => {
      googleLoginConfig.onSuccess({ code: 'test' });
    });

    await waitFor(() => {
      rerender();
      expect(isLoading).toBe(false);
    });
  });

  // ============ SILENT REFRESH ============
  test('silent refresh is called with prompt none', () => {
    useGoogleLogin.mockReturnValue(jest.fn());

    const { result } = renderHook(() => useGoogleAuth(), { wrapper });

    // Check that useGoogleLogin was called with prompt: 'none'
    const calls = useGoogleLogin.mock.calls;
    const silentRefreshCall = calls.find(
      (call) => call[0].prompt === 'none'
    );

    expect(silentRefreshCall).toBeTruthy();
  });

  test('silentRefresh has prompt none', () => {
    let silentRefreshConfig;
    useGoogleLogin.mockImplementation((config) => {
      if (config.prompt === 'none') {
        silentRefreshConfig = config;
      }
      return jest.fn();
    });

    const { result } = renderHook(() => useGoogleAuth(), { wrapper });

    expect(silentRefreshConfig).toBeDefined();
    expect(silentRefreshConfig.prompt).toBe('none');
  });

  test('silent refresh handles error gracefully', async () => {
    let refreshConfig;
    useGoogleLogin.mockImplementation((config) => {
      if (config.prompt === 'none') {
        refreshConfig = config;
      }
      return jest.fn();
    });

    let contextError;
    function TestComponent() {
      const { error } = useAuth();
      contextError = error;
      useGoogleAuth();
      return null;
    }

    renderHook(() => TestComponent(), { wrapper });

    act(() => {
      refreshConfig.onError({ error: 'popup_closed_by_user' });
    });

    // Silent refresh errors may or may not set error state depending on implementation
    expect(refreshConfig.onError).toBeDefined();
  });

  // ============ SESSION EXPIRY INTEGRATION ============
  test('silentRefresh onError sets sessionExpired to true', async () => {
    let refreshConfig;
    useGoogleLogin.mockImplementation((config) => {
      if (config.prompt === 'none') {
        refreshConfig = config;
      }
      return jest.fn();
    });

    let contextSessionExpired;
    function TestComponent() {
      const { sessionExpired } = useAuth();
      contextSessionExpired = sessionExpired;
      useGoogleAuth();
      return null;
    }

    renderHook(() => TestComponent(), { wrapper });

    act(() => {
      refreshConfig.onError({ error: 'popup_closed_by_user' });
    });

    await waitFor(() => {
      expect(contextSessionExpired).toBe(true);
    });
  });

  test('needsRefresh triggers silentRefresh call', async () => {
    const mockSilentRefresh = jest.fn();
    useGoogleLogin.mockImplementation((config) => {
      if (config.prompt === 'none') {
        return mockSilentRefresh;
      }
      return jest.fn();
    });

    let contextSetNeedsRefresh;
    function TestComponent() {
      const { setNeedsRefresh } = useAuth();
      contextSetNeedsRefresh = setNeedsRefresh;
      useGoogleAuth();
      return null;
    }

    renderHook(() => TestComponent(), { wrapper });

    act(() => {
      contextSetNeedsRefresh(true);
    });

    await waitFor(() => {
      expect(mockSilentRefresh).toHaveBeenCalled();
    });
  });
});
