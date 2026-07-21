"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { SidebarContent } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useUserRole";
import { useToast } from "@/components/ui/toast";

// Routes that only managers may access
const MANAGER_ONLY_ROUTES = [
  "/dashboard/analytics",
  "/dashboard/workflows",
  "/dashboard/workspaces",
  "/dashboard/agents",
  "/dashboard/search",
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { error: toastError } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Route guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    // Not authenticated → send to login
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Employee trying to access manager-only route → redirect + toast
    if (user.role === "employee" && MANAGER_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
      toastError("Access Denied", "You don't have access to this page.");
      router.replace("/dashboard");
    }
  }, [pathname, user, loading, router, toastError]);

  // While auth resolves, render nothing to avoid flash
  if (loading) return null;

  return (
    <div className="relative min-h-screen flex bg-neutral-950 text-slate-200">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-xs animate-slide-in h-full">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main page wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header - Top navigation */}
        <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-950/20 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900"
            >
              <Menu className="h-4.5 w-4.5 text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded">
                Sandbox Mode
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">•</span>
              <p className="text-xs text-slate-400 font-medium hidden sm:inline">Active session</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Free tier</span>
            </div>

            {/* User avatar with role indicator */}
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                {user?.name?.charAt(0) ?? "U"}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-slate-200 leading-none">{user?.name ?? "User"}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider leading-none mt-0.5 ${
                  user?.role === "manager" ? "text-violet-400" : "text-slate-500"
                }`}>
                  {user?.role ?? "employee"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
