"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cpu, Activity, Coins, Hourglass, ArrowUpRight,
  MessageSquare, Play, RefreshCw, FileText,
  Sparkles, Clock, Bot, BookOpen, Settings2, ArrowRight,
  Plus, CheckCircle2, AlertTriangle, Search, Filter, ShieldCheck, Zap
} from "lucide-react";
import { client, Agent, Workflow, DocumentFile } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RoleGate from "@/components/layout/RoleGate";
import { useAuth } from "@/hooks/useUserRole";

// Activity log stream items
const ACTIVITIES = [
  { id: "act-1", time: "10:14 AM", agent: "Acura Core Coordinator",  action: "Google Search Routing",           status: "completed", detail: "Scraped 4 search results for query 'AI chip demand trends Q3'" },
  { id: "act-2", time: "09:45 AM", agent: "Python Code Optimizer",   action: "Execute Script AST Refactor",     status: "completed", detail: "Parsed 'Q3_StrategicPlan.pdf' & generated telemetry stats in 1.4s" },
  { id: "act-3", time: "09:12 AM", agent: "System Workflow Runner",   action: "Slack Alert Trigger",             status: "completed", detail: "Slack hook executed successfully to channel #market-feed" },
  { id: "act-4", time: "Yesterday",agent: "Market Analyst Agent",    action: "Vector Embedding Generation",    status: "failed",    detail: "Timeout exception contacting OpenAI embedding endpoint (sk-proj-...)" },
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
  const [selectedActivity, setSelectedActivity] = useState<typeof ACTIVITIES[0] | null>(null);

  useEffect(() => {
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
          },
          {
            id: "chat-2",
            title: "Getting Started with AcuraX Playground",
            lastActive: "09:55 AM",
            lastQuestion: "Compare competitor pricing in APAC",
          },
          {
            id: "chat-3",
            title: "VPN Setup & Secure Remote Access",
            lastActive: "Yesterday",
            lastQuestion: "Explain pgvector vs Pinecone",
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
  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading AcuraX Telemetry Cockpit...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── HEADER BANNER ────────────────────────────────────────────────────── */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {user?.role === "manager" ? "Administrator Cockpit" : "Team Member Hub"}
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">Session Active</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Welcome back, <span className="text-indigo-600">{firstName}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-xl">
              {user?.role === "manager"
                ? "Monitor agent execution states, token bandwidth, and live workflow logs."
                : "Ask AcuraX AI questions, search internal knowledge bases, and view team documents."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "manager" ? (
              <>
                <Link href="/dashboard/agents">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs">
                    <Plus className="h-4 w-4 mr-1.5" /> Deploy Agent
                  </Button>
                </Link>
                <Link href="/dashboard/chat">
                  <Button variant="outline" size="sm" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                    <MessageSquare className="h-4 w-4 mr-1.5 text-indigo-600" /> Playground
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard/chat">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                  <MessageSquare className="h-4 w-4 mr-1.5" /> Start New Chat
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── MANAGER VIEW ─────────────────────────────────────────────────── */}
      <RoleGate allow={["manager"]}>
        <div className="space-y-8">
          {/* KPI Telemetry Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active AI Agents</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1.5">{activeCount} / {agents.length}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Cluster Operational</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Cpu className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tokens Consumed</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1.5">{(totalTokens / 1000).toFixed(1)}k</p>
                  <p className="text-[11px] text-slate-500 mt-2">gpt-4o & claude-3.5</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Activity className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DAG Workflows</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1.5">{workflows.length}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-2">98.8% Success rate</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600">
                  <Zap className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Monthly Cost</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1.5">${costEst}</p>
                  <p className="text-[11px] text-slate-500 mt-2">Free sandbox quota</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600">
                  <Coins className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Agents Monitor Table */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-indigo-600" />
                  Deployed Agents Health Monitor
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Active state, model allocations, and total call metrics
                </CardDescription>
              </div>
              <Link href="/dashboard/agents">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                  Manage All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 overflow-x-auto">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{agent.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{agent.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="hidden sm:inline px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono font-semibold">
                        {agent.model}
                      </span>
                      <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                        {agent.status}
                      </Badge>
                      <span className="font-mono text-slate-500 hidden md:inline">
                        {(agent.tokensUsed / 1000).toFixed(1)}k tokens
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Real-time System Activity Stream */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-sky-600" />
                Real-Time Execution Feed
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Live agent tool calls, API webhooks, and embedding status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {ACTIVITIES.map((act) => (
                <div
                  key={act.id}
                  onClick={() => setSelectedActivity(act)}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {act.status === "completed" ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900">{act.agent} — <span className="text-slate-600 font-normal">{act.action}</span></p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{act.detail}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{act.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </RoleGate>

      {/* ── EMPLOYEE VIEW ─────────────────────────────────────────────────── */}
      <RoleGate allow={["employee"]}>
        <div className="space-y-8">
          <Card className="bg-white border-slate-200 shadow-sm p-6">
            <div className="max-w-2xl mx-auto space-y-4 text-center">
              <h2 className="text-xl font-bold text-slate-900">Ask AcuraX AI Assistant</h2>
              <p className="text-xs text-slate-500">Instant answers sourced directly from internal knowledge base & company documents.</p>
              
              <Link href="/dashboard/chat" className="block">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all text-slate-500 hover:text-slate-800 shadow-2xs group">
                  <Search className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                  <span className="text-xs font-medium text-left flex-1">e.g. &quot;What is our WFH equipment stipend policy?&quot;</span>
                  <kbd className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-2xs">Enter ↵</kbd>
                </div>
              </Link>
            </div>
          </Card>

          {/* Recent Conversations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-indigo-600" />
                Recent Conversations
              </h3>
              <Link href="/dashboard/chat">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:bg-indigo-50">View All</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {employeeChats.slice(0, 3).map((chat) => (
                <Link key={chat.id} href="/dashboard/chat">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-all h-full flex flex-col justify-between group shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-slate-400">{chat.lastActive}</span>
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{chat.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">&quot;{chat.lastQuestion}&quot;</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>AcuraX Assistant</span>
                      <span className="text-indigo-600 font-semibold">Resume →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </RoleGate>
    </div>
  );
}
