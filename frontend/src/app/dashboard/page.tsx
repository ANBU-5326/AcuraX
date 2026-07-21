"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cpu, Activity, Coins, Hourglass, ArrowUpRight,
  MessageSquare, Play, RefreshCw, FileText,
  Sparkles, Clock, Bot, BookOpen, Settings2, ArrowRight
} from "lucide-react";
import { client, Agent, Workflow, DocumentFile } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RoleGate from "@/components/layout/RoleGate";
import { useAuth } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

// ── Manager activity stream (existing) ───────────────────────────────────────
const ACTIVITIES = [
  { id: "act-1", time: "10:14 AM", agent: "Acura Core Coordinator",  action: "Google Search routing",           status: "completed", detail: "Scraped 4 search results for query 'AI chip demand'" },
  { id: "act-2", time: "09:45 AM", agent: "Python Code Optimizer",   action: "Execute Python Script",           status: "completed", detail: "Parsed 'Q3_StrategicPlan.pdf' & generated stats image in 1.4s" },
  { id: "act-3", time: "09:12 AM", agent: "System Workflow",          action: "Workflow triggered: Stock Sentiment", status: "completed", detail: "Slack hook executed successfully to channel #market-feed" },
  { id: "act-4", time: "Yesterday",agent: "Market Analyst Agent",    action: "API Embedding generation",        status: "failed",    detail: "Timeout exception contacting OpenAI endpoint (sk-proj-...)" },
];

interface ChatHistoryItem {
  id: string;
  title: string;
  lastActive: string;
  lastQuestion: string;
  messages?: any[];
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [docs, setDocs] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeChats, setEmployeeChats] = useState<ChatHistoryItem[]>([]);

  useEffect(() => {
    // Load employee chats from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("acurax_chats");
      if (stored) {
        try {
          setEmployeeChats(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse chats", e);
        }
      } else {
        const defaults: ChatHistoryItem[] = [
          {
            id: "chat-1",
            title: "Remote Work & Flexible Hours Policy",
            lastActive: "10:32 AM",
            lastQuestion: "Summarise Q3 strategic plan highlights",
            messages: [
              { id: "m1", sender: "user", text: "Summarise Q3 strategic plan highlights", timestamp: "10:30 AM" },
              { id: "m2", sender: "assistant", text: "Here is a summary of the Q3 strategic plan remote expectations:\n- Core hours: reachable **10:00 AM – 3:00 PM** local timezone.\n- Hardware budget: reimbursed up to **$400** for monitor, **$100** for accessories.\n- Home internet: **$50/month** stipend.\n\nAll eligibility rules are documented in the **Remote Work & Flexible Hours Policy**.", timestamp: "10:32 AM", sources: ["Remote Work & Flexible Hours Policy"] }
            ]
          },
          {
            id: "chat-2",
            title: "Getting Started with AcuraX Playground",
            lastActive: "09:55 AM",
            lastQuestion: "Compare competitor pricing in APAC",
            messages: [
              { id: "m3", sender: "user", text: "Compare competitor pricing in APAC", timestamp: "09:52 AM" },
              { id: "m4", sender: "assistant", text: "Comparing APAC pricing models:\n- Competitor A: $29/user/month (basic support)\n- Competitor B: $45/user/month (includes advanced security integrations)\n\nAcuraX core agents provide tools to crawl web directories and retrieve local parameters dynamically. Refer to **Getting Started with AcuraX Playground** to set up a market query.", timestamp: "09:55 AM", sources: ["Getting Started with AcuraX Playground"] }
            ]
          },
          {
            id: "chat-3",
            title: "How to Reset Your Password",
            lastActive: "Yesterday",
            lastQuestion: "Generate a Python script to parse CSV",
            messages: [
              { id: "m5", sender: "user", text: "Generate a Python script to parse CSV", timestamp: "Yesterday" },
              { id: "m6", sender: "assistant", text: "Here is the code script requested:\n\n```python\nimport csv\n\ndef parse_acurax_csv(filepath):\n    with open(filepath, mode='r') as file:\n        reader = csv.DictReader(file)\n        return [row for row in reader]\n```\n\nTo update settings or reset authentication keys, please see **How to Reset Your Password** for details.", timestamp: "Yesterday", sources: ["How to Reset Your Password"] }
            ]
          },
          {
            id: "chat-4",
            title: "Leave & Time-Off Request Process",
            lastActive: "Yesterday",
            lastQuestion: "What are the embedding model options?",
            messages: [
              { id: "m7", sender: "user", text: "What are the embedding model options?", timestamp: "Yesterday" },
              { id: "m8", sender: "assistant", text: "AcuraX defaults to standard text-embedding-ada-002 or text-embedding-3-small. These compile document chunks into pgvector formats.\n\nNote: If requesting leave for training or study regarding AI systems, consult the **Leave & Time-Off Request Process** for eligibility rules.", timestamp: "Yesterday", sources: ["Leave & Time-Off Request Process"] }
            ]
          },
          {
            id: "chat-5",
            title: "VPN Setup & Secure Remote Access",
            lastActive: "Monday",
            lastQuestion: "Explain pgvector vs Pinecone",
            messages: [
              { id: "m9", sender: "user", text: "Explain pgvector vs Pinecone", timestamp: "Monday" },
              { id: "m10", sender: "assistant", text: "Core difference:\n- **pgvector**: Local postgres extension, secure, keeps credentials behind company firewall.\n- **Pinecone**: Cloud-native SaaS database.\n\nEnsure you connect to the company VPN to access PGVector endpoints. Follow instructions in **VPN Setup & Secure Remote Access**.", timestamp: "Monday", sources: ["VPN Setup & Secure Remote Access"] }
            ]
          }
        ];
        localStorage.setItem("acurax_chats", JSON.stringify(defaults));
        setEmployeeChats(defaults);
      }
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [a, w, d] = await Promise.all([
          client.getAgents(),
          client.getWorkflows(),
          client.getDocuments(),
        ]);
        setAgents(a);
        setWorkflows(w);
        setDocs(d);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalTokens = agents.reduce((sum, item) => sum + item.tokensUsed, 0);
  const activeCount = agents.filter((item) => item.status === "active").length;
  const costEst = (totalTokens / 1_000_000 * 3.5).toFixed(2);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Assembling cockpit telemetry...</p>
      </div>
    );
  }

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  return (
    <div className="space-y-8">
      {/* ── EMPLOYEE VIEW ─────────────────────────────────────────────────── */}
      <RoleGate allow={["employee"]}>
        <div className="space-y-8 animate-fade-in">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
              Welcome back, {firstName}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Here&apos;s what&apos;s happening with your workspace today.
            </p>
          </div>

          {/* CTA Card */}
          <Link href="/dashboard/chat" className="block group">
            <div className={cn(
              "relative overflow-hidden rounded-xl border border-violet-500/20",
              "bg-gradient-to-r from-violet-600/90 to-indigo-700/80 p-8",
              "transition-all duration-200 cursor-pointer shadow-lg shadow-violet-900/10",
              "hover:border-violet-400/40 hover:-translate-y-0.5 hover:shadow-violet-900/30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            )}
            tabIndex={0}
            aria-label="Start a new AI chat conversation"
            >
              <div className="absolute top-0 right-0 w-80 h-full bg-white/[0.03] -skew-x-12 translate-x-20 transition-transform group-hover:translate-x-10 duration-500" />
              <div className="relative z-10 flex items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    Interactive Playground
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white">Start a New Chat</h2>
                  <p className="text-violet-100/85 text-xs max-w-md">
                    Ask questions, extract details from policies, or generate content using your team&apos;s shared AI agents.
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center border border-white/10 text-white group-hover:scale-110 transition-transform duration-200 shrink-0">
                  <MessageSquare className="h-7 w-7" />
                </div>
              </div>
            </div>
          </Link>

          {/* Grid layout for Activity and Quick Links */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card className="h-full" glass>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-violet-400" />
                    My Recent Activity
                  </CardTitle>
                  <CardDescription className="text-xs">Your last 5 questions across all sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                  {employeeChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-300">No activity yet</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Start your first chat to see history here.</p>
                      </div>
                      <Link href="/dashboard/chat">
                        <Button size="sm" className="h-8 text-[10px] font-bold mt-2">
                          Start Chat
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {employeeChats.slice(0, 5).map((item) => (
                        <Link
                          key={item.id}
                          href={`/dashboard/chat?chatId=${item.id}`}
                          className={cn(
                            "flex items-start gap-3.5 p-3.5 rounded-xl text-left w-full",
                            "bg-white/[0.01] border border-white/5",
                            "hover:border-violet-500/30 hover:bg-violet-500/[0.02] hover:-translate-y-0.5 transition-all duration-150",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950"
                          )}
                          aria-label={`Reopen chat session about ${item.title}`}
                        >
                          <div className="h-8 w-8 rounded-lg bg-violet-600/10 border border-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <MessageSquare className="h-4 w-4 text-violet-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-200 truncate group-hover:text-violet-300 transition-colors">
                              {item.lastQuestion}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{item.title}</span>
                              <span className="text-[10px] text-slate-600">•</span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {item.lastActive}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-650 shrink-0 self-center" />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                Quick Links
              </h3>
              
              <div className="space-y-3">
                {[
                  {
                    title: "Documents",
                    desc: "Search and view shared documents.",
                    href: "/dashboard/documents",
                    icon: <FileText className="h-5 w-5 text-blue-400" />,
                    badge: "View"
                  },
                  {
                    title: "Knowledge Base",
                    desc: "Browse company guides and policies.",
                    href: "/dashboard/knowledge-base",
                    icon: <BookOpen className="h-5 w-5 text-emerald-400" />,
                    badge: "Browse"
                  },
                  {
                    title: "Settings",
                    desc: "Manage your personal profile.",
                    href: "/dashboard/settings",
                    icon: <Settings2 className="h-5 w-5 text-amber-400" />,
                    badge: "Manage"
                  }
                ].map((link) => (
                  <Link key={link.title} href={link.href} className="block">
                    <div className={cn(
                      "p-5 rounded-xl border border-white/10 bg-white/[0.02]",
                      "transition-all duration-200 cursor-pointer flex gap-4 items-center justify-between",
                      "hover:border-purple-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-950/10",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950"
                    )}
                    tabIndex={0}
                    aria-label={`Go to ${link.title}`}
                    >
                      <div className="flex gap-3.5 items-center min-w-0">
                        <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg shrink-0">
                          {link.icon}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-200 leading-snug">{link.title}</h4>
                          <p className="text-[11px] text-slate-400 leading-normal mt-0.5 truncate">{link.desc}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold text-slate-500 border-slate-800 shrink-0">
                        {link.badge}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>

        </div>
      </RoleGate>

      {/* ── MANAGER VIEW ──────────────────────────────────────────────────── */}
      <RoleGate allow={["manager"]}>
        <div className="space-y-6">
          {/* Welcome banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
                Workspace telemetry
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Real-time execution stats, token volume, and agent performance reports.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/chat">
                <Button className="h-9 text-xs">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Launch Playground
                </Button>
              </Link>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card glass>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-xs font-semibold text-slate-400">Active Agents</span>
                <Cpu className="h-4 w-4 text-violet-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-slate-100">{activeCount} / {agents.length}</div>
                <p className="text-[10px] text-slate-500 mt-1">Ready for instruction queues</p>
              </CardContent>
            </Card>

            <Card glass>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-xs font-semibold text-slate-400">Monthly Cost</span>
                <Coins className="h-4 w-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-slate-100">${costEst}</div>
                <p className="text-[10px] text-slate-500 mt-1">Estimated Claude & OpenAI rates</p>
              </CardContent>
            </Card>

            <Card glass>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-xs font-semibold text-slate-400">Token Volume</span>
                <Activity className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-slate-100">{(totalTokens / 1000).toFixed(1)}K</div>
                <p className="text-[10px] text-slate-500 mt-1">Accumulated context tokens</p>
              </CardContent>
            </Card>

            <Card glass>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-xs font-semibold text-slate-400">Workflow Runs</span>
                <Play className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-slate-100">{workflows.length} Flows</div>
                <p className="text-[10px] text-slate-500 mt-1">2 published schedules active</p>
              </CardContent>
            </Card>
          </div>

          {/* SVG Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Token Trend Chart Card */}
            <Card className="lg:col-span-2" glass>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Token Usage Trend</span>
                  <Badge variant="outline">Last 7 Days</Badge>
                </CardTitle>
                <CardDescription>Daily context and embedding generation metrics.</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex flex-col justify-end pt-4">
                <div className="relative w-full h-full flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#1e293b" strokeDasharray="4" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#1e293b" strokeDasharray="4" />
                    <line x1="0" y1="130" x2="500" y2="130" stroke="#1e293b" strokeDasharray="4" />
                    <path d="M 0 160 L 0 120 L 83 90 L 166 140 L 249 70 L 332 50 L 415 110 L 500 40 L 500 180 Z" fill="url(#chart-glow)" />
                    <path d="M 0 120 L 83 90 L 166 140 L 249 70 L 332 50 L 415 110 L 500 40" fill="none" stroke="#8b5cf6" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="0"   cy="120" r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="1" />
                    <circle cx="83"  cy="90"  r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="1" />
                    <circle cx="166" cy="140" r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="1" />
                    <circle cx="249" cy="70"  r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="1" />
                    <circle cx="332" cy="50"  r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="1" />
                    <circle cx="415" cy="110" r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="1" />
                    <circle cx="500" cy="40"  r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="1" />
                  </svg>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-semibold mt-3 px-1">
                  <span>June 18</span><span>June 19</span><span>June 20</span>
                  <span>June 21</span><span>June 22</span><span>June 23</span><span>Today</span>
                </div>
              </CardContent>
            </Card>

            {/* Model Distribution */}
            <Card glass>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Model Deployment</CardTitle>
                <CardDescription>Active models distribution in layout.</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex flex-col justify-between">
                <div className="flex justify-center items-center h-32 relative">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.91" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.91" fill="none" stroke="#8b5cf6" strokeWidth="3.2" strokeDasharray="60 100" strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.91" fill="none" stroke="#10b981" strokeWidth="3.2" strokeDasharray="30 100" strokeDashoffset="-60" />
                    <circle cx="18" cy="18" r="15.91" fill="none" stroke="#f59e0b" strokeWidth="3.2" strokeDasharray="10 100" strokeDashoffset="-90" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-black text-slate-100">{agents.length}</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Agents</span>
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  {[
                    { label: "Claude 3.5 Sonnet", color: "bg-violet-500", pct: "60%" },
                    { label: "GPT-4o",             color: "bg-emerald-500", pct: "30%" },
                    { label: "Llama 3.1 70B",      color: "bg-amber-500",  pct: "10%" },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${m.color}`} />
                        <span className="text-slate-300">{m.label}</span>
                      </div>
                      <span className="font-bold text-slate-400">{m.pct}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activities & Overview lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent logs */}
            <Card className="lg:col-span-2" glass>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Hourglass className="h-4.5 w-4.5 text-violet-400" />
                  Recent Agent Execution Stream
                </CardTitle>
                <CardDescription>Unified timeline of model triggers, tool usages, and error alerts.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ACTIVITIES.map((act) => (
                    <div key={act.id} className="flex gap-4 p-3 rounded-xl bg-slate-900/30 border border-slate-900/60 hover:bg-slate-900/50 hover:border-slate-800 transition-all">
                      <div className="flex flex-col items-center pt-1 shrink-0">
                        <span className="text-[10px] text-slate-500 font-bold">{act.time}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">{act.agent}</span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-xs text-slate-400">{act.action}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{act.detail}</p>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <Badge variant={act.status === "completed" ? "success" : "destructive"}>
                          {act.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sync Summary */}
            <Card glass>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-indigo-400" />
                  Document Registry
                </CardTitle>
                <CardDescription>Knowledge base index status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="divide-y divide-slate-800/60 space-y-3">
                  {docs.slice(0, 3).map((d) => (
                    <div key={d.id} className="flex items-center justify-between pt-3 first:pt-0">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-300 truncate">{d.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{d.size} • {d.chunks || 0} vector chunks</p>
                      </div>
                      <Badge variant={d.status === "ready" ? "success" : "warning"}>
                        {d.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-800/60 pt-4">
                  <Link href="/dashboard/documents" className="flex items-center justify-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-bold transition-colors">
                    <span>Manage Knowledge Files</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </RoleGate>
    </div>
  );
}
