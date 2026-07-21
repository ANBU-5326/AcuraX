import type { User, UserRole } from "@/types/auth";

const SESSION_KEY = "acurax_session";
const ACCESS_TOKEN_KEY = "acurax_access_token";
const REFRESH_TOKEN_KEY = "acurax_refresh_token";

// ── Mock Users (fallback when backend is not running) ─────────────────────────

export const MOCK_MANAGER: User = {
  id: "usr-mgr-001",
  name: "John Doe",
  email: "admin@acurax.ai",
  role: "manager",
  teamId: "team-alpha",
};

export const MOCK_EMPLOYEE: User = {
  id: "usr-emp-002",
  name: "Jane Smith",
  email: "jane@acurax.ai",
  role: "employee",
  teamId: "team-alpha",
};

// ── JWT-like helpers ──────────────────────────────────────────────────────────

function encodeToken(user: User): string {
  const payload = btoa(JSON.stringify(user));
  return `mock.${payload}.sig`;
}

function decodeToken(token: string): User | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1])) as User;
  } catch {
    return null;
  }
}

// ── Real JWT token helpers ────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRealTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearRealTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ── Parse user profile from backend JWT ──────────────────────────────────────

export function parseUserFromJWT(accessToken: string): User | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    // payload has sub (user id), role
    return null; // Will be fetched from /auth/me
  } catch {
    return null;
  }
}

// ── Session accessors (backward compat) ───────────────────────────────────────

export function saveSession(user: User): void {
  if (typeof window === "undefined") return;
  const token = encodeToken(user);
  localStorage.setItem(SESSION_KEY, token);
}

export function getSession(): User | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(SESSION_KEY);
  if (!token) return null;
  return decodeToken(token);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  clearRealTokens();
}

export function getRoleFromSession(): UserRole {
  const user = getSession();
  return user?.role ?? "employee";
}

// ── saveSessionFromBackend: save real backend user into session store ─────────

export function saveSessionFromBackend(backendUser: any): void {
  const user: User = {
    id: backendUser.id,
    name: backendUser.full_name,
    email: backendUser.email,
    role: (backendUser.role as UserRole) || "employee",
    teamId: backendUser.team_id,
  };
  saveSession(user);
}
