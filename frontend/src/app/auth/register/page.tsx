"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cpu, Lock, Mail, User, Building, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { saveSession, setRealTokens } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [role, setRole] = useState<"manager" | "employee">("manager");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      error("Validation Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      saveSession({
        id: "usr-new",
        email,
        name,
        role,
        teamId: "team-alpha",
      });
      setRealTokens("mock-jwt-access-token-new-reg", "mock-jwt-refresh-token");

      success("Account Initialized", `Welcome to AcuraX, ${name}!`);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex selection:bg-indigo-600 selection:text-white">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-indigo-600 via-indigo-800 to-slate-900 p-12 flex-col justify-between text-white overflow-hidden border-r border-indigo-700">
        <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Cpu className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Acura<span className="text-indigo-400">X</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-lg space-y-6">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Provision your AI Operations Workspace in seconds.
          </h2>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Multi-tenant isolation & custom tenant domain configuration</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Instant sandbox credits for Claude 3.5 & GPT-4o models</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Role-based team invitations & API token controls</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>SOC2 Compliant Security Framework</span>
        </div>
      </div>

      {/* Right Register Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Create AcuraX Account</h1>
            <p className="text-xs text-slate-600">Set up your workspace tenant and admin role</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Role selector pill */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Account Type</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRole("manager")}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    role === "manager" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Admin Manager
                </button>
                <button
                  type="button"
                  onClick={() => setRole("employee")}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    role === "employee" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Team Member
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="pl-9 bg-white border-slate-200 text-xs text-slate-900 focus:border-indigo-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="pl-9 bg-white border-slate-200 text-xs text-slate-900 focus:border-indigo-600"
                  required
                />
              </div>
            </div>

            {role === "manager" && (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Workspace / Team Name</label>
                <div className="relative">
                  <Building className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Acme AI Research"
                    className="pl-9 bg-white border-slate-200 text-xs text-slate-900 focus:border-indigo-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Password</label>
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
              {loading ? "Provisioning..." : "Provision Account & Workspace"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Already registered?{" "}
            <Link href="/auth/login" className="text-indigo-600 hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
