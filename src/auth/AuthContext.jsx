import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const getApiUrl = () => {
  if (typeof process !== 'undefined' && process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  return 'http://localhost:3001';
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = getApiUrl();

  const login = (userData) => setUser(userData);

  const logout = async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/auth/user`, {
          credentials: 'include',
        });

        if (response.ok) {
          const { user: sessionUser } = await response.json();
          if (sessionUser) {
            setUser(sessionUser);
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [apiUrl]);

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
