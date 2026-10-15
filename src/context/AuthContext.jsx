import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticateEmployee } from '../services/authService';

const AuthContext = createContext();

const SESSION_STORAGE_KEY = 'sensaflow_auth_session';
const LEGACY_SESSION_STORAGE_KEY = 'floodguard_auth_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(!import.meta.env.VITE_API_URL);

  // Initialize session from sessionStorage (or localStorage if remember was checked)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY) 
        || localStorage.getItem(SESSION_STORAGE_KEY)
        || sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY)
        || localStorage.getItem(LEGACY_SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sessionExpiry && Date.now() < parsed.sessionExpiry) {
          setUser(parsed.user);
          setToken(parsed.token);
          setIsDemoMode(Boolean(parsed.isDemo));
        } else {
          // Session expired
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.removeItem(SESSION_STORAGE_KEY);
          sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
          localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
        }
      }
    } catch {
      // Storage access or parse error fallback
    }
  }, []);

  const login = async (credentials) => {
    setIsAuthenticating(true);
    setLoginError(null);
    try {
      const result = await authenticateEmployee(credentials);
      setUser(result.user);
      setToken(result.token);
      setIsDemoMode(result.isDemo);

      const sessionData = JSON.stringify({
        user: result.user,
        token: result.token,
        sessionExpiry: result.sessionExpiry,
        isDemo: result.isDemo
      });

      if (credentials.rememberDevice) {
        localStorage.setItem(SESSION_STORAGE_KEY, sessionData);
      } else {
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessionData);
      }

      return { success: true, user: result.user };
    } catch (err) {
      setLoginError(err.message || 'An unexpected authentication error occurred.');
      return { success: false, error: err.message };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setLoginError(null);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isAuthenticating,
        loginError,
        setLoginError,
        login,
        logout,
        isDemoMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
