"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { SidebarContent } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
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

  // While auth resolves, render nothing to avoid layout flash
  if (loading) return null;

  return (
    <div className="relative min-h-screen flex bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-xs h-full animate-in slide-in-from-left duration-300">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 p-1 rounded-lg border border-slate-200 bg-white z-10"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar Header */}
        <Topbar onMobileMenuOpen={() => setMobileOpen(true)} />

        {/* Dynamic Page Content Container */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
