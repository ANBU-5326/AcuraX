"use client";

import React, { useState } from "react";
import { 
  BarChart3, RefreshCw, Layers, TrendingUp, DollarSign, 
  Activity, Calendar, TableProperties
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AnalyticsCockpit() {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const logs = [
    { id: "log-1", time: "10:14 AM", agent: "Acura Core Coordinator", model: "Claude 3.5 Sonnet", promptTokens: 420, completionTokens: 180, cost: "$0.0039", latency: "0.82s" },
    { id: "log-2", time: "09:45 AM", agent: "Python Code Optimizer", model: "GPT-4o", promptTokens: 1200, completionTokens: 850, cost: "$0.0145", latency: "1.45s" },
    { id: "log-3", time: "09:12 AM", agent: "Market Analyst Agent", model: "Llama 3.1 70B", promptTokens: 310, completionTokens: 120, cost: "$0.0004", latency: "0.61s" },
    { id: "log-4", time: "08:55 AM", agent: "Acura Core Coordinator", model: "Claude 3.5 Sonnet", promptTokens: 840, completionTokens: 450, cost: "$0.0092", latency: "1.10s" }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
            Workspace Analytics
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Track token distribution, latency metrics, and API invoice allocations.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="h-10 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus-visible:outline-none"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button variant="outline" onClick={handleRefresh} disabled={loading} className="h-10 border-slate-800">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-violet-400" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-400">Total API Cost</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-100">$2.68</div>
            <p className="text-[10px] text-slate-500 mt-1">Avg daily burn: $0.38</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-400">Mean Latency</span>
            <Activity className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-100">0.98s</div>
            <p className="text-[10px] text-slate-500 mt-1">95th percentile: 1.45s</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-400">Cache Hit Rate</span>
            <Layers className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-100">38.4%</div>
            <p className="text-[10px] text-slate-500 mt-1">pgvector caching nodes</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency graph */}
        <Card className="lg:col-span-2" glass>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-violet-400" />
              Agent Latency (Seconds)
            </CardTitle>
            <CardDescription>Average latency duration across model calls.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-end pt-4">
            <div className="relative w-full h-full flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                <line x1="0" y1="40" x2="500" y2="40" stroke="#1e293b" strokeDasharray="4" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="#1e293b" strokeDasharray="4" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="#1e293b" strokeDasharray="4" />

                {/* Graph bars */}
                {/* 1. Claude: 0.8s */}
                <rect x="50" y="100" width="30" height="80" rx="4" fill="#8b5cf6" />
                {/* 2. GPT4o: 1.4s */}
                <rect x="175" y="40" width="30" height="140" rx="4" fill="#10b981" />
                {/* 3. Llama: 0.6s */}
                <rect x="300" y="120" width="30" height="60" rx="4" fill="#f59e0b" />
                {/* 4. Embedding: 0.2s */}
                <rect x="425" y="150" width="30" height="30" rx="4" fill="#3b82f6" />
              </svg>
            </div>
            <div className="flex justify-around text-[9px] text-slate-500 font-semibold mt-3">
              <span className="w-30 text-center">Claude Sonnet</span>
              <span className="w-30 text-center">GPT-4o</span>
              <span className="w-30 text-center">Llama 70B</span>
              <span className="w-30 text-center">Embeddings</span>
            </div>
          </CardContent>
        </Card>

        {/* Cost distribution */}
        <Card glass>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Billing Breakdown</CardTitle>
            <CardDescription>Proportional spend per LLM.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-between">
            <div className="flex justify-center items-center h-32 relative">
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.91" fill="none" stroke="#1e293b" strokeWidth="3.2" />
                {/* Claude: 70% */}
                <circle cx="18" cy="18" r="15.91" fill="none" stroke="#8b5cf6" strokeWidth="3.4" strokeDasharray="70 100" strokeDashoffset="0" />
                {/* GPT4o: 20% */}
                <circle cx="18" cy="18" r="15.91" fill="none" stroke="#10b981" strokeWidth="3.4" strokeDasharray="20 100" strokeDashoffset="-70" />
                {/* Other: 10% */}
                <circle cx="18" cy="18" r="15.91" fill="none" stroke="#3b82f6" strokeWidth="3.4" strokeDasharray="10 100" strokeDashoffset="-90" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-base font-black text-slate-100">$2.68</span>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Total Cost</span>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  <span className="text-slate-300">Claude 3.5 Sonnet</span>
                </div>
                <span className="font-bold text-slate-400">$1.88</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">GPT-4o</span>
                </div>
                <span className="font-bold text-slate-400">$0.54</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-slate-300">Embeddings / Other</span>
                </div>
                <span className="font-bold text-slate-400">$0.26</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Details List */}
      <Card glass>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TableProperties className="h-4.5 w-4.5 text-violet-400" />
            Workspace execution logs
          </CardTitle>
          <CardDescription>Line item audit report of model transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-900 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Agent</th>
                  <th className="p-3">AI Model</th>
                  <th className="p-3">Prompt</th>
                  <th className="p-3">Completion</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 text-slate-500 font-medium">{log.time}</td>
                    <td className="p-3 font-bold text-slate-200">{log.agent}</td>
                    <td className="p-3 text-slate-400">{log.model}</td>
                    <td className="p-3 text-slate-400">{log.promptTokens} t</td>
                    <td className="p-3 text-slate-400">{log.completionTokens} t</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-850 font-semibold font-mono text-[10px]">
                        {log.latency}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-300">{log.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
