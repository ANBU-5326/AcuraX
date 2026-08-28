"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles, Cpu, Layers, Activity, Search, ShieldCheck, ArrowRight,
  CheckCircle2, Terminal, Play, Zap, FileText, Database, GitFork, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"agent" | "workflow" | "vector">("agent");

  const features = [
    {
      icon: <Cpu className="h-6 w-6 text-indigo-600" />,
      title: "Autonomous Tool Agents",
      desc: "Instantiate stateful agents powered by Claude 3.5 & GPT-4o with Python scrapers, web tools, and REST hooks.",
      tag: "v2.4 Core"
    },
    {
      icon: <GitFork className="h-6 w-6 text-indigo-600" />,
      title: "Visual DAG Workflows",
      desc: "Connect multi-step execution graphs with parallel branching, retry loops, and failover notifications.",
      tag: "Canvas Builder"
    },
    {
      icon: <Activity className="h-6 w-6 text-sky-600" />,
      title: "Real-Time Telemetry",
      desc: "Monitor token consumption, per-second API costs, model latency distribution, and agent call stacks.",
      tag: "Telemetry"
    },
    {
      icon: <Search className="h-6 w-6 text-emerald-600" />,
      title: "PGVector Semantic RAG",
      desc: "Chunk PDF/Markdown docs into 1536-dim vector embeddings for sub-40ms semantic retrieval.",
      tag: "Vector Engine"
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-amber-600" />,
      title: "Enterprise RBAC & Security",
      desc: "Granular Manager vs Employee permission gates with TLS 1.3 token isolation and audit logs.",
      tag: "Zero Trust"
    },
    {
      icon: <Database className="h-6 w-6 text-indigo-600" />,
      title: "Multi-Tenant Workspaces",
      desc: "Isolate agent memory, prompt templates, and vector databases across custom client workspaces.",
      tag: "Multi-Tenant"
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-sans flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 cyber-grid-bg opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-100/60 via-indigo-50/30 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Header navbar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Acura<span className="text-indigo-600">X</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-6xl mx-auto pt-16 pb-24 relative z-10">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold mb-8 shadow-xs">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <span>AcuraX Enterprise Suite v2.4 Live</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-900">
          Orchestrate Multi-Agent <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600">
            Intelligence At Scale
          </span>
        </h1>

        <p className="text-base md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          Build visual execution graphs, orchestrate stateful Claude 3.5 & GPT-4o agents with custom Python tools, and search vector stores with sub-50ms latency.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 justify-center w-full sm:w-auto">
          <Link href="/auth/login">
            <Button size="lg" className="w-full sm:w-auto h-13 px-8 font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 rounded-xl">
              Enter AI Cockpit <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-13 px-8 text-sm border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-2xs font-semibold">
              Explore Architecture
            </Button>
          </a>
        </div>

        {/* Live Interactive Agent Playground Simulator */}
        <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white text-left overflow-hidden shadow-xl mb-20">
          {/* Top Bar Tabs */}
          <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-mono text-slate-500">acurax-agent-sandbox.log</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveTab("agent")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "agent" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Market Agent
              </button>
              <button
                onClick={() => setActiveTab("workflow")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "workflow" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Code DAG
              </button>
              <button
                onClick={() => setActiveTab("vector")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "vector" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                PGVector RAG
              </button>
            </div>
          </div>

          {/* Simulator Content Area inside dark console box for high readability */}
          <div className="p-6 font-mono text-xs bg-slate-950 text-slate-100 space-y-4">
            {activeTab === "agent" && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span className="text-indigo-400 font-bold">▶ AGENT: Acura Core Market Coordinator</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">EXECUTING</span>
                </div>
                <div className="text-slate-300 leading-relaxed space-y-2">
                  <p className="text-slate-400">[09:42:01] <span className="text-cyan-400">TOOL_CALL:</span> google_web_search(query=&quot;AI GPU demand trends Q3&quot;)</p>
                  <p className="text-slate-400">[09:42:02] <span className="text-amber-400">VECTOR_LOOKUP:</span> pgvector index match 0.94 score in &apos;Enterprise_Report.pdf&apos;</p>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-200">
                    <span className="text-emerald-400 font-bold">SUMMARY OUTPUT:</span> Q3 enterprise AI chip demand surged by 38% YoY. Recommending model allocation increase to 4,000 GPU instances across primary region.
                  </div>
                </div>
              </div>
            )}

            {activeTab === "workflow" && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span className="text-indigo-400 font-bold">▶ DAG WORKFLOW: Code Refactor &amp; CI Pipeline</span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">PASSED (1.4s)</span>
                </div>
                <div className="text-slate-300 space-y-2">
                  <p className="text-slate-400">STEP 1 [Parse AST]: Complete • 120 lines parsed</p>
                  <p className="text-slate-400">STEP 2 [Python Optimizer Agent]: Applied memory reduction refactor</p>
                  <p className="text-slate-400">STEP 3 [Slack Alert Hook]: Sent webhook to #dev-notifications</p>
                </div>
              </div>
            )}

            {activeTab === "vector" && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span className="text-sky-400 font-bold">▶ VECTOR QUERY: &quot;What is the employee WFH budget?&quot;</span>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 font-semibold">34ms LATENCY</span>
                </div>
                <div className="text-slate-300 space-y-2">
                  <p className="text-slate-400">Embedding vector: [0.0142, -0.0891, 0.4412 ... 1536 dims]</p>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-200">
                    <span className="text-indigo-400 font-bold">MATCH FOUND (Distance 0.12):</span> &quot;Remote Work Policy Section 4: Employees are eligible for $400 monitor reimbursement and $50/mo internet stipend.&quot;
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl py-8 border-y border-slate-200 mb-24">
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-indigo-600">&lt; 45ms</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Avg DAG Latency</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-slate-900">99.98%</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Cluster Uptime</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-indigo-600">100M+</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Tokens Processed</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-slate-900">14+</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Tool Integrations</p>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="w-full text-left scroll-mt-24 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Designed for Enterprise AI Operations</h2>
            <p className="text-sm md:text-base text-slate-600">Everything you need to build, test, monitor, and scale production AI agents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-slate-200 bg-white glassmorphism-card hover:border-indigo-300 transition-all duration-300 group flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl group-hover:scale-105 transition-transform duration-300">
                      {f.icon}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                  <span>Learn architecture</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-slate-600 font-medium">Encrypted TLS 1.3 Sandbox Environment</span>
          </div>
          <span>&copy; 2026 AcuraX Inc. Multi-Agent AI Suite. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
