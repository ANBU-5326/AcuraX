"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Cpu, MessageSquareCode, GitFork,
  Files, Database, Search, BarChart3, Settings2,
  LogOut, ChevronDown, Building, ShieldCheck, Sparkles, Activity
} from "lucide-react";
import { client, Workspace } from "@/lib/api";
import { useUserRole } from "@/hooks/useUserRole";
import { clearSession } from "@/store/authStore";

interface SidebarContentProps {
  onNavClick?: () => void;
}

interface NavSection {
  title: string;
  items: {
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
  }[];
}

const MANAGER_SECTIONS: NavSection[] = [
  {
    title: "Core Workspace",
    items: [
      { name: "Overview",        href: "/dashboard",              icon: <LayoutDashboard className="h-4 w-4" /> },
      { name: "Playground Chat", href: "/dashboard/chat",          icon: <MessageSquareCode className="h-4 w-4" />, badge: "AI" },
    ],
  },
  {
    title: "AI Intelligence",
    items: [
      { name: "Autonomous Agents",href: "/dashboard/agents",        icon: <Cpu className="h-4 w-4" /> },
      { name: "DAG Workflows",    href: "/dashboard/workflows",     icon: <GitFork className="h-4 w-4" /> },
      { name: "Semantic Search", href: "/dashboard/search",        icon: <Search className="h-4 w-4" /> },
    ],
  },
  {
    title: "Data & Knowledge",
    items: [
      { name: "Knowledge Base",  href: "/dashboard/knowledge-base",icon: <Database className="h-4 w-4" /> },
      { name: "Documents",       href: "/dashboard/documents",     icon: <Files className="h-4 w-4" /> },
      { name: "Workspaces",      href: "/dashboard/workspaces",    icon: <Building className="h-4 w-4" /> },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Analytics & Telemetry", href: "/dashboard/analytics", icon: <BarChart3 className="h-4 w-4" /> },
      { name: "Settings",        href: "/dashboard/settings",      icon: <Settings2 className="h-4 w-4" /> },
    ],
  },
];

const EMPLOYEE_SECTIONS: NavSection[] = [
  {
    title: "Main Workspace",
    items: [
      { name: "Home Dashboard",  href: "/dashboard",              icon: <LayoutDashboard className="h-4 w-4" /> },
      { name: "Playground Chat", href: "/dashboard/chat",          icon: <MessageSquareCode className="h-4 w-4" />, badge: "AI" },
    ],
  },
  {
    title: "Knowledge & Docs",
    items: [
      { name: "Documents",       href: "/dashboard/documents",     icon: <Files className="h-4 w-4" /> },
      { name: "Knowledge Base",  href: "/dashboard/knowledge-base",icon: <Database className="h-4 w-4" /> },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "Settings",        href: "/dashboard/settings",      icon: <Settings2 className="h-4 w-4" /> },
    ],
  },
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
    }).catch(console.error);
  }, []);

  const sections = role === "manager" ? MANAGER_SECTIONS : EMPLOYEE_SECTIONS;

  const handleLogout = () => {
    clearSession();
    router.push("/auth/login");
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 px-4 py-5 overflow-hidden select-none">
      {/* Brand logo & header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-300">
            <Cpu className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1">
              Acura<span className="text-indigo-600">X</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase -mt-1">AI Operations OS</span>
          </div>
        </Link>

        {/* Role badge */}
        {role === "manager" ? (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
            Admin
          </span>
        ) : (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
            Team
          </span>
        )}
      </div>

      {/* Tenant Switcher (Manager Only) */}
      {role === "manager" && (
        <div className="relative mb-5">
          <button
            onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
            className="flex items-center justify-between w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-indigo-300 transition-all focus:outline-none shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                {selectedWS?.name.charAt(0) || "A"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{selectedWS?.name || "AcuraX Enterprise"}</p>
                <p className="text-[10px] font-semibold text-slate-500">{selectedWS?.tier || "Enterprise"} Tenant</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
          </button>

          {wsDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 p-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => { setSelectedWS(ws); setWsDropdownOpen(false); }}
                  className={`flex items-center gap-2.5 w-full p-2 rounded-lg text-left text-xs hover:bg-slate-100 transition-colors ${
                    selectedWS?.id === ws.id ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-700"
                  }`}
                >
                  <div className="h-6 w-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                    {ws.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="font-bold truncate">{ws.name}</p>
                    <p className="text-[9px] text-slate-500">{ws.tier}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <h4 className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
              {section.title}
            </h4>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavClick}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600 transition-colors"}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* System Telemetry & Cluster Status Widget */}
      <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              <span>Cluster Health</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Optimal</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[94%]" />
          </div>
          <p className="text-[10px] text-slate-500">3 Active Agents • 14ms latency</p>
        </div>

        {/* Exit Workspace */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Exit Workspace</span>
        </button>
      </div>
    </div>
  );
}

export default SidebarContent;
