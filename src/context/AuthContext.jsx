// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { loginUser, registerUser, fetchMe } from "../api/chatService";
import {
  getToken,
  setToken,
  clearToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
} from "../utils/authStorage";
import { clearPersistedState } from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setTokenState] = useState(() => getToken());
  // While we re-validate a stored token against the backend on first load.
  const [checking, setChecking] = useState(() => !!getToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    clearToken();
    clearStoredUser();
    clearPersistedState();
    setTokenState(null);
    setUser(null);
  }, []);

  // Validate any stored token once on mount - it may have expired since the
  // last visit, in which case we fall back to the login screen.
  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStoredUser(me);
      })
      .catch(() => {
        if (cancelled) return;
        reset();
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The API client dispatches this when a request comes back 401 (expired/
  // invalid token) so every logged-in view reacts consistently.
  useEffect(() => {
    const handleUnauthorized = () => reset();
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [reset]);

  const applySession = (result) => {
    setToken(result.access_token);
    setStoredUser(result.user);
    setTokenState(result.access_token);
    setUser(result.user);
  };

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginUser(email, password);
      applySession(result);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerUser(email, password);
      applySession(result);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    reset();
  }, [reset]);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    isAuthenticated: !!user && !!token,
    checking,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
