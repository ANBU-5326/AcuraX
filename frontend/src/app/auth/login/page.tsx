"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Shield, Sparkles, Cpu, ShieldCheck, UserCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useUserRole";
import { client } from "@/lib/api";
import { saveSessionFromBackend, MOCK_MANAGER, MOCK_EMPLOYEE } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { success, error } = useToast();
  const [email, setEmail] = useState("admin@acurax.ai");
  const [password, setPassword] = useState("AcuraXPassword2026!");
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState<"manager" | "employee" | null>(null);

  // ── Quick-login helpers ──────────────────────────────────────────────────
  const handleQuickLogin = async (role: "manager" | "employee") => {
    setQuickLoading(role);
    const creds = role === "manager"
      ? { email: "admin@acurax.ai", password: "AcuraXPassword2026!" }
      : { email: "jane@acurax.ai", password: "AcuraXPassword2026!" };
    try {
      await client.login(creds.email, creds.password);
      const me = await client.getMe();
      saveSessionFromBackend(me);
      const user = role === "manager" ? MOCK_MANAGER : MOCK_EMPLOYEE;
      user.name = me.full_name;
      user.email = me.email;
      user.role = me.role;
      user.teamId = me.team_id;
      login(user);
      success(`Welcome, ${me.full_name}!`, `Signed in as ${me.role}.`);
    } catch {
      // Fall back to mock login
      const user = role === "manager" ? MOCK_MANAGER : MOCK_EMPLOYEE;
      login(user);
      success(`Welcome, ${user.name}!`, `Signed in as ${role === "manager" ? "Manager / Admin" : "Employee"}.`);
    }
    router.push("/dashboard");
    setQuickLoading(null);
  };

  // ── Standard credential login ─────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error("Authentication Failed", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      // Try real backend login
      await client.login(email, password);
      const me = await client.getMe();
      saveSessionFromBackend(me);
      const sessionUser = {
        id: me.id,
        name: me.full_name,
        email: me.email,
        role: me.role as any,
        teamId: me.team_id,
      };
      login(sessionUser);
      success("Access Granted", "Welcome to AcuraX multi-agent cockpit.");
      router.push("/dashboard");
    } catch (apiError: any) {
      // Fall back to mock login for dev convenience
      if (email === "admin@acurax.ai" && (password === "password" || password === "AcuraXPassword2026!")) {
        login(MOCK_MANAGER);
        success("Access Granted", "Welcome to AcuraX multi-agent cockpit.");
        router.push("/dashboard");
      } else if (email === "jane@acurax.ai" && (password === "password" || password === "AcuraXPassword2026!")) {
        login(MOCK_EMPLOYEE);
        success("Access Granted", "Welcome back, Jane!");
        router.push("/dashboard");
      } else if (email === "arun@acurax.ai" && (password === "password" || password === "AcuraXPassword2026!")) {
        login({ ...MOCK_EMPLOYEE, id: "usr-emp-003", name: "Arun Kumar", email: "arun@acurax.ai" });
        success("Access Granted", "Welcome back, Arun!");
        router.push("/dashboard");
      } else {
        error("Invalid Credentials", "Please verify your email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-neutral-950 to-neutral-950 px-4 overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "2s" }} />

      <div className="w-full max-w-md z-10 transition-all duration-300">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-xl shadow-violet-900/40 mb-3 border border-violet-500/30">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-violet-400 bg-clip-text text-transparent">
            Acura<span className="text-violet-500 font-medium">X</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Deploy, orchestrate, and audit custom AI agents</p>
        </div>

        {/* Quick login role buttons */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            id="quick-login-manager"
            onClick={() => handleQuickLogin("manager")}
            disabled={!!quickLoading || loading}
            className="group flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-violet-500/30 bg-violet-600/10 hover:bg-violet-600/20 hover:border-violet-500/60 transition-all duration-200 text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-2 w-full">
              <ShieldCheck className="h-4 w-4 text-violet-400 shrink-0" />
              <span className="text-xs font-bold text-violet-300">
                {quickLoading === "manager" ? "Signing in…" : "Manager / Admin"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 w-full">Full dashboard access</p>
          </button>

          <button
            id="quick-login-employee"
            onClick={() => handleQuickLogin("employee")}
            disabled={!!quickLoading || loading}
            className="group flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-slate-700/60 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-600 transition-all duration-200 text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-2 w-full">
              <UserCircle2 className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-xs font-bold text-slate-300">
                {quickLoading === "employee" ? "Signing in…" : "Employee"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 w-full">Limited team access</p>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">or sign in manually</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Card envelope */}
        <Card className="glassmorphism hover:border-violet-500/20" glass>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-500" />
              Sign in
            </CardTitle>
            <CardDescription>
              Enter credentials below to access your secure cockpit.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@acurax.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <a href="#" className="text-xs text-violet-400 hover:text-violet-300 hover:underline">
                    Forgot?
                  </a>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Credentials hint */}
              <div className="text-[10px] text-slate-600 space-y-0.5 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                <p className="font-bold text-slate-500 mb-1">Demo credentials</p>
                <p>Manager → <span className="text-slate-400">admin@acurax.ai / AcuraXPassword2026!</span></p>
                <p>Employee → <span className="text-slate-400">jane@acurax.ai / AcuraXPassword2026!</span></p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-2">
              <Button id="login-submit" type="submit" className="w-full h-11" loading={loading}>
                <Sparkles className="h-4 w-4 mr-2" />
                Launch Dashboard
              </Button>
              <div className="text-xs text-center text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="text-violet-400 hover:text-violet-300 hover:underline">
                  Create one
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
