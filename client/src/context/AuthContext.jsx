import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    try {
      // Primary key used by the app
      const stored = localStorage.getItem("estatehub_auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token && parsed?.user) {
          setToken(parsed.token);
          setUser(parsed.user);
        }
      } else {
        // Migrate old keys written by the previous login page
        const oldToken = localStorage.getItem("token");
        const oldUser = localStorage.getItem("authUser");
        if (oldToken && oldUser) {
          const parsedUser = JSON.parse(oldUser);
          setToken(oldToken);
          setUser(parsedUser);
          // Persist under the correct key and clean up old ones
          localStorage.setItem("estatehub_auth", JSON.stringify({ token: oldToken, user: parsedUser }));
          localStorage.removeItem("token");
          localStorage.removeItem("userRole");
          localStorage.removeItem("authUser");
        }
      }
    } catch {
      // ignore
    } finally {
      setAuthLoading(false);
    }
  }, []);

  function login(nextUser, nextToken) {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(
      "estatehub_auth",
      JSON.stringify({ user: nextUser, token: nextToken })
    );
  }

  function logout() {
    setUser(null);
    setToken("");
    localStorage.removeItem("estatehub_auth");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("authUser");
  }

  const value = { user, token, authLoading, login, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

