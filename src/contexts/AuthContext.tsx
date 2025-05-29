import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '@/services/authService';
import { getUserById, isTokenExpired } from '@/services/clientAuthService';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: Omit<User, 'password'>) => void;
  logout: () => void;
  updateUser: (userData: Partial<Omit<User, 'password'>>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      try {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          // Token expired, clear localStorage
          localStorage.removeItem('auth_token');
          setIsLoading(false);
          return;
        }
        
        // Parse token to get user ID
        const decoded = JSON.parse(atob(storedToken.split('.')[1]));
        
        // Get user data
        getUserById(decoded.id, storedToken)
          .then(userData => {
            if (userData) {
              setUser(userData);
              setToken(storedToken);
            } else {
              // Invalid user, clear localStorage
              localStorage.removeItem('auth_token');
            }
          })
          .catch(() => {
            // Error fetching user, clear localStorage
            localStorage.removeItem('auth_token');
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (error) {
        // Invalid token, clear localStorage
        localStorage.removeItem('auth_token');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, userData: Omit<User, 'password'>) => {
    // Save token to localStorage
    localStorage.setItem('auth_token', newToken);
    
    // Update state
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    
    // Update state
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData: Partial<Omit<User, 'password'>>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
