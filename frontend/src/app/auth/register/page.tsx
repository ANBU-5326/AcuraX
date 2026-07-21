"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ShieldAlert, Sparkles, Cpu } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      error("Registration Failed", "Please fill in all fields.");
      return;
    }
    
    setLoading(true);
    // Simulate API registration delay
    setTimeout(() => {
      setLoading(false);
      success("Account Created", "Your AcuraX account has been initialized.");
      router.push("/auth/login");
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-neutral-950 to-neutral-950 px-4 overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "2s" }} />

      <div className="w-full max-w-md z-10">
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

        {/* Card envelope */}
        <Card className="glassmorphism hover:border-violet-500/20" glass>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-violet-500" />
              Create account
            </CardTitle>
            <CardDescription>
              Deploy a new private workspace on AcuraX sandbox.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <Input
                  type="email"
                  placeholder="name@acurax.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-2">
              <Button type="submit" className="w-full h-11" loading={loading}>
                <Sparkles className="h-4 w-4 mr-2" />
                Initialize Workspace
              </Button>
              <div className="text-xs text-center text-slate-500">
                Already registered?{" "}
                <Link href="/auth/login" className="text-violet-400 hover:text-violet-300 hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
