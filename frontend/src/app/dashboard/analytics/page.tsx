"use client";

import React, { useState } from "react";
import { 
  BarChart3, TrendingUp, Cpu, Coins, Clock, Zap, 
  Activity, ArrowDownToLine, RefreshCw, Calendar
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

const LOG_ENTRIES = [
  { id: "1", time: "10:14:02", agent: "Acura Core Coordinator", model: "Claude 3.5 Sonnet", promptTokens: 1420, completionTokens: 380, latency: "0.84s", cost: "$0.027" },
  { id: "2", time: "09:45:12", agent: "Python Code Optimizer", model: "GPT-4o", promptTokens: 890, completionTokens: 210, latency: "1.20s", cost: "$0.011" },
  { id: "3", time: "09:12:55", agent: "System Workflow Runner", model: "Claude 3.5 Sonnet", promptTokens: 2400, completionTokens: 610, latency: "1.45s", cost: "$0.045" },
  { id: "4", time: "08:30:10", agent: "Market Analyst Agent", model: "GPT-4o", promptTokens: 520, completionTokens: 120, latency: "0.45s", cost: "$0.006" },
  { id: "5", time: "Yesterday", agent: "Acura Core Coordinator", model: "Claude 3.5 Sonnet", promptTokens: 3100, completionTokens: 820, latency: "1.80s", cost: "$0.058" },
];

export default function AnalyticsDashboard() {
  const { success } = useToast();
  const [timeframe, setTimeframe] = useState("7d");
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      success("Telemetry Refreshed", "Loaded latest API call logs.");
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            Analytics & Telemetry
          </h1>
          <p className="text-slate-600 text-xs mt-1">
            Real-time LLM token consumption, latency metrics, and API cost allocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <Button variant="outline" onClick={handleRefresh} disabled={loading} className="h-10 border-slate-200 bg-white font-semibold">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total API Cost</span>
            <Coins className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">$2.68</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">↓ 14% vs previous cycle</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mean Latency</span>
            <Clock className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">0.98s</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Sub-second average call time</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cache Hit Rate</span>
            <Zap className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">38.4%</div>
            <p className="text-[11px] text-slate-500 mt-1">PGVector cache acceleration</p>
          </CardContent>
        </Card>
      </div>

      {/* Model Cost Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-white border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-indigo-600" />
            Model Cost Allocation
          </h3>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-800">Claude 3.5 Sonnet</span>
                <span className="font-bold text-slate-900">$1.88 (70%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full w-[70%]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-800">GPT-4o</span>
                <span className="font-bold text-slate-900">$0.54 (20%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full w-[20%]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-800">Embeddings & Other</span>
                <span className="font-bold text-slate-900">$0.26 (10%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[10%]" />
              </div>
            </div>
          </div>
        </Card>

        {/* Detailed Call Stack Table */}
        <Card className="lg:col-span-2 p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
          <CardHeader className="p-6 border-b border-slate-100 bg-slate-50">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-indigo-600" />
              Recent Agent Call Telemetry
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Audit per-request prompt tokens, completion tokens, latency, and cost.
            </CardDescription>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Agent</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Prompt</th>
                  <th className="p-3">Completion</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {LOG_ENTRIES.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{log.agent}</td>
                    <td className="p-3 text-slate-600 font-medium">{log.model}</td>
                    <td className="p-3 text-slate-500 font-mono">{log.promptTokens} t</td>
                    <td className="p-3 text-slate-500 font-mono">{log.completionTokens} t</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold font-mono text-[10px] text-slate-700">
                        {log.latency}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-indigo-600 font-mono">{log.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
