import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthState } from '../types/auth';
import { authService } from '../services/authService';
import { UnauthorizedError } from '../api/client';

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('collabspace_token');

    // Any 401 from any API call cleanly logs the user out (no hard page reload).
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('collabspace_token');
      localStorage.removeItem('collabspace_user');
    };
    window.addEventListener('collabspace:unauthorized', handleUnauthorized);

    const restore = async () => {
      if (!token) {
        localStorage.removeItem('collabspace_user');
        setIsLoading(false);
        return;
      }

      try {
        const u = await authService.getCurrentUser();
        setUser(u);
        localStorage.setItem('collabspace_user', JSON.stringify(u));
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          // Token is definitively invalid/expired — clean logout.
          handleUnauthorized();
        } else {
          // Transient failure (network blip, 5xx, unreachable API base URL):
          // keep the session token and fall back to the cached profile so a
          // refresh hiccup does not log the user out.
          const cached = localStorage.getItem('collabspace_user');
          if (cached) {
            try {
              setUser(JSON.parse(cached) as User);
            } catch {
              localStorage.removeItem('collabspace_user');
            }
          } else {
            localStorage.removeItem('collabspace_token');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    restore();

    return () => window.removeEventListener('collabspace:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, pass: string) => {
    const result = await authService.login(email, pass);
    setUser(result.user);
    localStorage.setItem('collabspace_token', result.token);
    localStorage.setItem('collabspace_user', JSON.stringify(result.user));
  };

  const signup = async (name: string, email: string, pass: string) => {
    const result = await authService.signup(name, email, pass);
    setUser(result.user);
    localStorage.setItem('collabspace_token', result.token);
    localStorage.setItem('collabspace_user', JSON.stringify(result.user));
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('collabspace_token');
      localStorage.removeItem('collabspace_user');
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...updates };
    setUser(next);
    localStorage.setItem('collabspace_user', JSON.stringify(next));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
