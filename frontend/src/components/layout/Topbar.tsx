"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu, Sparkles, Search, Bell, Cpu, LogOut, Settings2,
  ChevronDown, Activity, CheckCircle2, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/hooks/useUserRole";
import { clearSession } from "@/store/authStore";

interface TopbarProps {
  onMobileMenuOpen?: () => void;
}

export function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    router.push("/auth/login");
  };

  return (
    <header className="h-16 border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      {/* Left section: Mobile menu + Status badge + Command bar trigger */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Sandbox Core</span>
            <span className="sm:hidden">Core</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
            <Activity className="h-3.5 w-3.5 text-sky-600" />
            <span>99.98% Telemetry</span>
          </div>
        </div>

        {/* Global Search Trigger */}
        <div className="hidden lg:flex items-center">
          <Link href="/dashboard/search">
            <button className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 text-xs font-medium transition-all group w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span className="flex-1 text-left">Search docs, agents...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-500 font-mono shadow-2xs">⌘K</kbd>
            </button>
          </Link>
        </div>
      </div>

      {/* Right section: AI Model Pill + Notifications + User Avatar Dropdown */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Model status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-slate-500">Model:</span>
          <span className="font-semibold text-slate-900">Claude 3.5 & GPT-4o</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">System Notifications</span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">2 New</span>
              </div>
              <div className="space-y-3 pt-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">DAG Workflow Executed</p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Market Analysis DAG completed with 0 errors in 1.4s.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Vector Embeddings Ready</p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Indexed 14 markdown documents to pgvector.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all focus:outline-none"
          >
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
              {user?.name?.charAt(0) ?? "U"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-none">{user?.name ?? "User"}</span>
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                {user?.role ?? "employee"}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:inline" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900">{user?.name ?? "User"}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email ?? "user@acurax.ai"}</p>
              </div>

              <Link
                href="/dashboard/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 transition-all"
              >
                <Settings2 className="h-4 w-4 text-slate-500" />
                <span>Account Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition-all mt-1 font-semibold"
              >
                <LogOut className="h-4 w-4" />
                <span>Exit Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
