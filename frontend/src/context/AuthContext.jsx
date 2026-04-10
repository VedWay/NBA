import { createContext, useContext, useMemo, useState } from "react";
import { authApi } from "../api/facultyApi";

const STORAGE_KEY = "nba_auth";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (email, password) => {
    const payload = await authApi.login({ email, password });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setAuth(payload);
    return payload;
  };

  const registerAccount = async (payload) => {
    const response = await authApi.register(payload);
    if (response?.access_token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
      setAuth(response);
    }
    return response;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  };

  const value = useMemo(
    () => ({
      auth,
      token: auth?.access_token,
      role: auth?.role ?? "viewer",
      user: auth?.user ?? null,
      isAuthenticated: Boolean(auth?.access_token),
      login,
      registerAccount,
      logout,
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
