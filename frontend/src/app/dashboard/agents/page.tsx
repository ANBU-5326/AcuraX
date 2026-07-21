"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cpu, Plus, ToggleLeft, ToggleRight, Trash2,
  Sparkles, RefreshCw, Play, Users, Lock
} from "lucide-react";
import { client, Agent } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import RoleGate from "@/components/layout/RoleGate";
import { useUserRole } from "@/hooks/useUserRole";

export default function AgentsManager() {
  const { success, error } = useToast();
  const role = useUserRole();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State (manager only)
  const [modalOpen, setModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newAgentModel, setNewAgentModel] = useState("Claude 3.5 Sonnet");
  const [newAgentTemp, setNewAgentTemp] = useState(0.4);
  const [newAgentSystem, setNewAgentSystem] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [newAgentShared, setNewAgentShared] = useState(false);
  const [creating, setCreating] = useState(false);

  const availableTools = [
    { id: "web_search",        name: "Web Search Scraper",       desc: "Retrieve search queries in real-time" },
    { id: "python_sandbox",    name: "Python Secure Compiler",   desc: "Execute custom mathematical operations" },
    { id: "filesystem_writer", name: "Workspace Sync",           desc: "Write outputs and data back to files" },
    { id: "browser_scraper",   name: "Crawler",                  desc: "Dynamic DOM renderer for web scraping" },
  ];

  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await client.getAgents();
      setAgents(data);
    } catch {
      error("Error Loading Agents", "Could not fetch active agent configurations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAgents(); }, []);

  const handleToggleStatus = async (id: string, currentStatus: "active" | "inactive") => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await client.updateAgent(id, { status: nextStatus });
      setAgents((prev) => prev.map((a) => a.id === id ? { ...a, status: nextStatus } : a));
      success("Agent Updated", "Status toggled successfully.");
    } catch {
      error("Toggle Failed", "Could not update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to decommission this agent?")) return;
    try {
      await client.deleteAgent(id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      success("Agent Decommissioned", "The configuration files have been purged.");
    } catch {
      error("Failed to delete", "Could not decommission the agent.");
    }
  };

  const handleToolCheck = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName) { error("Validation Error", "Agent name is required."); return; }
    setCreating(true);
    try {
      const newAgent = await client.createAgent({
        name: newAgentName,
        description: newAgentDesc,
        model: newAgentModel,
        temperature: newAgentTemp,
        systemPrompt: newAgentSystem,
        tools: selectedTools,
        shared: newAgentShared,
      });
      setAgents((prev) => [...prev, newAgent]);
      success("Agent Initialized", `${newAgent.name} has been hotloaded in the sandbox.`);
      // Reset state
      setNewAgentName(""); setNewAgentDesc(""); setNewAgentModel("Claude 3.5 Sonnet");
      setNewAgentTemp(0.4); setNewAgentSystem(""); setSelectedTools([]); setNewAgentShared(false);
      setModalOpen(false);
    } catch {
      error("Deployment Error", "Could not compile agent configuration.");
    } finally {
      setCreating(false);
    }
  };

  // Agents visible to current role
  const visibleAgents = role === "manager" ? agents : agents.filter((a) => a.shared);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
            {role === "manager" ? "Agent Registry" : "Shared Agents"}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {role === "manager"
              ? "Instantiate, modify, and monitor specialized AI supervisors and coders."
              : "Run agents that your manager has shared with the team."}
          </p>
        </div>

        {/* Deploy button — managers only */}
        <RoleGate allow={["manager"]}>
          <Button onClick={() => setModalOpen(true)} className="h-10 text-xs font-bold shadow-md shadow-violet-900/20">
            <Plus className="h-4 w-4 mr-1.5" />
            Deploy Agent
          </Button>
        </RoleGate>

        {/* Read-only badge — employees */}
        <RoleGate allow={["employee"]}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-500">
            <Lock className="h-3 w-3" />
            Run-only access
          </div>
        </RoleGate>
      </div>

      {/* Empty state for employees with no shared agents */}
      {!loading && role === "employee" && visibleAgents.length === 0 && (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-3 text-center">
          <Users className="h-10 w-10 text-slate-700" />
          <p className="text-sm font-bold text-slate-500">No shared agents yet</p>
          <p className="text-xs text-slate-600 max-w-xs">
            Ask your manager to share an agent with your team to start using it here.
          </p>
        </div>
      )}

      {loading ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Querying local agent registries...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleAgents.map((agent) => (
            <Card key={agent.id} className="relative group overflow-hidden border-slate-800/80 hover:border-slate-700/60" glass>
              {/* Highlight bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${agent.avatarColor}`} />

              <CardHeader className="flex flex-row items-start justify-between pb-3 pt-6">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${agent.avatarColor} flex items-center justify-center shadow-lg border border-white/10 shrink-0 text-white`}>
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      {agent.name}
                      {/* Shared badge for managers */}
                      <RoleGate allow={["manager"]}>
                        {agent.shared && (
                          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                            Shared
                          </span>
                        )}
                      </RoleGate>
                    </CardTitle>
                    <CardDescription className="mt-0.5">{agent.model}</CardDescription>
                  </div>
                </div>

                {/* Manager controls: toggle + delete */}
                <RoleGate allow={["manager"]}>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(agent.id, agent.status)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {agent.status === "active" ? (
                        <ToggleRight className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/5 transition-colors"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </RoleGate>

                {/* Employee view: status badge only */}
                <RoleGate allow={["employee"]}>
                  <Badge variant={agent.status === "active" ? "success" : "outline"}>
                    {agent.status}
                  </Badge>
                </RoleGate>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{agent.description || "No description provided."}</p>

                {/* Micro Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40 text-[10px] font-semibold">
                  <div>
                    <span className="text-slate-500 uppercase block tracking-wider">Accumulated tokens</span>
                    <span className="text-slate-300 font-bold text-xs mt-0.5 block">{(agent.tokensUsed / 1000).toFixed(1)}k</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block tracking-wider">Temperature</span>
                    <span className="text-slate-300 font-bold text-xs mt-0.5 block">{agent.temperature}</span>
                  </div>
                </div>

                {/* Tools */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Capabilities / Tools</span>
                  <div className="flex flex-wrap gap-1">
                    {agent.tools.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic">No tools binding</span>
                    ) : (
                      agent.tools.map((t) => (
                        <Badge key={t} variant="outline" className="text-[9px] bg-slate-900 border-slate-800">
                          {t.replace("_", " ")}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Employee: Run button linking to playground */}
                <RoleGate allow={["employee"]}>
                  <Link href={`/dashboard/chat?agent=${agent.id}`} className="block">
                    <Button className="w-full h-9 text-xs mt-1" variant="outline">
                      <Play className="h-3.5 w-3.5 mr-2 text-emerald-400" />
                      Run Agent
                    </Button>
                  </Link>
                </RoleGate>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Creation Modal Dialog — Managers Only */}
      <RoleGate allow={["manager"]}>
        <Dialog isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Configure New Sandbox Agent">
          <form onSubmit={handleCreateAgent} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Agent Identifier Name</label>
              <Input placeholder="e.g. Code Reviewer Core" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Description</label>
              <Input placeholder="Describe what tasks this agent is specialized in" value={newAgentDesc} onChange={(e) => setNewAgentDesc(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Base AI Model</label>
                <select value={newAgentModel} onChange={(e) => setNewAgentModel(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
                  <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                  <option value="GPT-4o">GPT-4o</option>
                  <option value="Llama 3.1 70B">Llama 3.1 70B</option>
                  <option value="GPT-3.5 Turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <div className="space-y-1.5 font-semibold">
                <label className="text-xs text-slate-300 flex justify-between">
                  <span>Temperature</span>
                  <span>{newAgentTemp}</span>
                </label>
                <input type="range" min="0.0" max="1.0" step="0.1" value={newAgentTemp} onChange={(e) => setNewAgentTemp(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-600 border border-slate-800" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">System Core Instructions</label>
              <textarea placeholder="Provide background rules, behavior style, and limitations of this agent..." value={newAgentSystem} onChange={(e) => setNewAgentSystem(e.target.value)} className="flex min-h-[80px] w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-all duration-200" />
            </div>

            {/* Tools */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Augment Capabilities (Tools)</label>
              <div className="space-y-2 max-h-[140px] overflow-y-auto border border-slate-800/80 bg-slate-950 p-2.5 rounded-lg">
                {availableTools.map((t) => (
                  <label key={t.id} className="flex items-start gap-3 p-1.5 hover:bg-slate-900 rounded cursor-pointer transition-colors">
                    <input type="checkbox" checked={selectedTools.includes(t.id)} onChange={() => handleToolCheck(t.id)} className="mt-1 h-3.5 w-3.5 rounded border-slate-800 text-violet-600 bg-slate-950 focus:ring-violet-500/50 cursor-pointer" />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{t.name}</span>
                      <span className="text-[10px] text-slate-500">{t.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Share with team toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <div>
                <p className="text-xs font-bold text-slate-200">Share with team</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Employees can view and run this agent</p>
              </div>
              <button type="button" onClick={() => setNewAgentShared(!newAgentShared)} className="text-slate-400 hover:text-white transition-colors">
                {newAgentShared ? (
                  <ToggleRight className="h-6 w-6 text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-slate-600" />
                )}
              </button>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-800/60 mt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={creating}>
                <Sparkles className="h-4 w-4 mr-2" />
                Compile & Spin Up
              </Button>
            </div>
          </form>
        </Dialog>
      </RoleGate>
    </div>
  );
}
