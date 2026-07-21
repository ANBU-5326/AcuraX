"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession, saveSession, clearSession } from "@/store/authStore";
import type { User, UserRole } from "@/types/auth";

// ── useAuth ───────────────────────────────────────────────────────────────────
// Returns the current user, helpers to login/logout, and a loading flag.

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getSession());
    setLoading(false);
  }, []);

  const login = useCallback((u: User) => {
    saveSession(u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}

// ── useUserRole ───────────────────────────────────────────────────────────────
// Convenience hook — returns only the role string.
// Defaults to "employee" when no session exists (safe default).

export function useUserRole(): UserRole {
  const [role, setRole] = useState<UserRole>("employee");

  useEffect(() => {
    const session = getSession();
    setRole(session?.role ?? "employee");
  }, []);

  return role;
}
