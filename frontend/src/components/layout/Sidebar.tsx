"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Cpu, MessageSquareCode, GitFork,
  Files, Database, Search, BarChart3, Settings2,
  LogOut, ChevronDown, Building,
} from "lucide-react";
import { client, Workspace } from "@/lib/api";
import { useUserRole } from "@/hooks/useUserRole";
import { clearSession } from "@/store/authStore";

interface SidebarContentProps {
  onNavClick?: () => void;
}

// Nav items per role
const MANAGER_NAV = [
  { name: "Overview",        href: "/dashboard",              icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
  { name: "Agents",          href: "/dashboard/agents",        icon: <Cpu className="h-4.5 w-4.5" /> },
  { name: "Playground Chat", href: "/dashboard/chat",          icon: <MessageSquareCode className="h-4.5 w-4.5" /> },
  { name: "Workflows",       href: "/dashboard/workflows",     icon: <GitFork className="h-4.5 w-4.5" /> },
  { name: "Documents",       href: "/dashboard/documents",     icon: <Files className="h-4.5 w-4.5" /> },
  { name: "Knowledge Base",  href: "/dashboard/knowledge-base",icon: <Database className="h-4.5 w-4.5" /> },
  { name: "Semantic Search", href: "/dashboard/search",        icon: <Search className="h-4.5 w-4.5" /> },
  { name: "Analytics",       href: "/dashboard/analytics",     icon: <BarChart3 className="h-4.5 w-4.5" /> },
  { name: "Settings",        href: "/dashboard/settings",      icon: <Settings2 className="h-4.5 w-4.5" /> },
  { name: "Workspaces",      href: "/dashboard/workspaces",    icon: <Building className="h-4.5 w-4.5" /> },
];

const EMPLOYEE_NAV = [
  { name: "Home",            href: "/dashboard",              icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
  { name: "Playground Chat", href: "/dashboard/chat",          icon: <MessageSquareCode className="h-4.5 w-4.5" /> },
  { name: "Documents",       href: "/dashboard/documents",     icon: <Files className="h-4.5 w-4.5" /> },
  { name: "Knowledge Base",  href: "/dashboard/knowledge-base",icon: <Database className="h-4.5 w-4.5" /> },
  { name: "Settings",        href: "/dashboard/settings",      icon: <Settings2 className="h-4.5 w-4.5" /> },
];

export function SidebarContent({ onNavClick }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useUserRole();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWS, setSelectedWS] = useState<Workspace | null>(null);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);

  useEffect(() => {
    client.getWorkspaces().then((data) => {
      setWorkspaces(data);
      if (data.length > 0) setSelectedWS(data[0]);
    });
  }, []);

  const navItems = role === "manager" ? MANAGER_NAV : EMPLOYEE_NAV;

  const handleLogout = () => {
    clearSession();
    router.push("/auth/login");
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border-r border-slate-900 px-4 py-6">
      {/* Brand logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center border border-violet-500/20 shadow-md">
          <Cpu className="h-4 w-4 text-white" />
        </div>
        <span className="font-extrabold text-lg tracking-tight">
          Acura<span className="text-violet-500 font-medium">X</span>
        </span>

        {/* Role badge */}
        {role === "manager" ? (
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-600/20 text-violet-300 border border-violet-500/30 uppercase tracking-widest">
            Admin
          </span>
        ) : (
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-widest">
            Team
          </span>
        )}
      </div>

      {/* Workspace Switcher — managers only */}
      {role === "manager" && (
        <div className="relative mb-6">
          <button
            onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
            className="flex items-center justify-between w-full p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-left hover:border-slate-700 transition-colors focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-600/10 text-violet-400 flex items-center justify-center font-bold text-xs border border-violet-500/15">
                {selectedWS?.name.charAt(0) || "A"}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 line-clamp-1">{selectedWS?.name || "Loading..."}</p>
                <p className="text-[10px] text-slate-500">{selectedWS?.tier || "Free"} Tenant</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          {wsDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-in">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => { setSelectedWS(ws); setWsDropdownOpen(false); }}
                  className={`flex items-center gap-2 w-full p-2.5 text-left text-xs hover:bg-slate-800/60 transition-colors ${
                    selectedWS?.id === ws.id ? "bg-slate-800/40 text-violet-400" : "text-slate-300"
                  }`}
                >
                  <div className="h-6 w-6 rounded bg-violet-600/10 text-violet-400 flex items-center justify-center font-semibold text-[10px]">
                    {ws.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold line-clamp-1">{ws.name}</p>
                    <p className="text-[9px] text-slate-500">{ws.tier}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav list */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 ${
                isActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-900/35"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer operations */}
      <div className="border-t border-slate-900 pt-4 mt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-xs text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all font-medium"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Exit Workspace</span>
        </button>
      </div>
    </div>
  );
}

export default SidebarContent;
