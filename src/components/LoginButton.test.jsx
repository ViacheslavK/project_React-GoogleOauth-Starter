import { render, screen, fireEvent } from '@testing-library/react';
import { LoginButton } from './LoginButton';
import { AuthProvider } from '../auth/AuthContext';

jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: jest.fn(),
  GoogleOAuthProvider: ({ children }) => children,
}));

jest.mock('../auth/useGoogleAuth', () => ({
  useGoogleAuth: jest.fn(),
}));

import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleAuth } from '../auth/useGoogleAuth';

function renderLoginButton(user = null) {
  return render(
    <AuthProvider>
      <LoginButton />
    </AuthProvider>
  );
}

describe('LoginButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch BEFORE rendering AuthProvider
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null }),
    });
    const mockGoogleLogin = jest.fn();
    useGoogleLogin.mockReturnValue(mockGoogleLogin);
    useGoogleAuth.mockReturnValue({ googleLogin: mockGoogleLogin });
  });

  test('renders button when not logged in', () => {
    renderLoginButton();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  test('has correct text content', () => {
    renderLoginButton();
    expect(screen.getByTestId('login-button')).toHaveTextContent('Sign in with Google');
  });

  test('has correct aria-label', () => {
    renderLoginButton();
    expect(screen.getByTestId('login-button')).toHaveAttribute('aria-label', 'Sign in with Google');
  });

  test('calls googleLogin on click', () => {
    const mockGoogleLogin = jest.fn();
    useGoogleAuth.mockReturnValue({ googleLogin: mockGoogleLogin });

    renderLoginButton();
    const button = screen.getByTestId('login-button');
    fireEvent.click(button);

    expect(mockGoogleLogin).toHaveBeenCalled();
  });
});
