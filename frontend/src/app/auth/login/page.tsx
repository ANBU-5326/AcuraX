"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cpu, Lock, Mail, ArrowRight, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { saveSession, setRealTokens } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fillDemoManager = () => {
    setEmail("admin@acurax.ai");
    setPassword("AcuraXPassword2026!");
  };

  const fillDemoEmployee = () => {
    setEmail("jane@acurax.ai");
    setPassword("AcuraXPassword2026!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error("Validation Error", "Please fill in all credentials.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      let role: "manager" | "employee" = "employee";
      let name = "Jane Doe";

      if (email.includes("admin")) {
        role = "manager";
        name = "Admin Manager";
      } else if (email.includes("arun")) {
        role = "employee";
        name = "Arun Kumar";
      }

      saveSession({
        id: "usr-1",
        email,
        name,
        role,
        teamId: "team-alpha",
      });
      setRealTokens("mock-jwt-access-token-acurax-2026", "mock-jwt-refresh-token");

      success("Authentication Successful", `Welcome back, ${name}!`);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex selection:bg-indigo-600 selection:text-white">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-12 flex-col justify-between text-white overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

        {/* Brand logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Cpu className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Acura<span className="text-indigo-400">X</span>
          </span>
        </Link>

        {/* Center quote */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Next-Gen AI Cockpit
          </div>

          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Autonomous multi-agent orchestration for modern engineering teams.
          </h2>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Stateful Claude 3.5 & GPT-4o autonomous agents</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Sub-40ms PGVector semantic search & document RAG</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Role-gated Manager & Employee multi-tenant workspaces</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Encrypted TLS 1.3 Enterprise Sandbox</span>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="lg:hidden inline-flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Cpu className="h-4.5 w-4.5" />
              </div>
              <span className="font-extrabold text-lg">AcuraX</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Sign in to Cockpit</h1>
            <p className="text-xs text-slate-600">Enter your credentials or click a demo account below</p>
          </div>

          {/* Quick fill demo buttons */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-center">Quick Demo Login Presets</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoManager}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 text-left text-xs text-slate-800 transition-colors font-semibold"
              >
                <p className="font-bold text-indigo-600">Admin Manager</p>
                <p className="text-[10px] text-slate-500 font-normal">admin@acurax.ai</p>
              </button>
              <button
                type="button"
                onClick={fillDemoEmployee}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 text-left text-xs text-slate-800 transition-colors font-semibold"
              >
                <p className="font-bold text-sky-600">Team Member</p>
                <p className="text-[10px] text-slate-500 font-normal">jane@acurax.ai</p>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@acurax.ai"
                  className="pl-9 bg-white border-slate-200 text-xs text-slate-900 focus:border-indigo-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <span className="text-[11px] text-indigo-600 hover:underline cursor-pointer">Forgot?</span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-9 bg-white border-slate-200 text-xs text-slate-900 focus:border-indigo-600"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              {loading ? "Authenticating..." : "Sign In to Cockpit"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Don&apos;t have a workspace tenant?{" "}
            <Link href="/auth/register" className="text-indigo-600 hover:underline font-semibold">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
