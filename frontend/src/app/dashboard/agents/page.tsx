"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cpu, Plus, ToggleLeft, ToggleRight, Trash2,
  Sparkles, RefreshCw, Play, Users, Lock, Search, Filter, Wrench, ChevronRight
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleToggleStatus = async (id: string, currentStatus: Agent["status"]) => {
    const nextStatus: Agent["status"] = currentStatus === "active" ? "inactive" : "active";
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
      setModalOpen(false);
      setNewAgentName(""); setNewAgentDesc(""); setNewAgentSystem(""); setSelectedTools([]);
    } catch {
      error("Initialization Failed", "Could not instantiate agent.");
    } finally {
      setCreating(false);
    }
  };

  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Cpu className="h-7 w-7 text-indigo-600" />
            Autonomous Agent Fleet
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Instantiate, configure, and inspect stateful multi-model agents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 w-48 md:w-64 shadow-2xs"
            />
          </div>

          {role === "manager" && (
            <Button
              onClick={() => setModalOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Instantiate Agent
            </Button>
          )}
        </div>
      </div>

      {/* Agents Card Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500">Querying agent fleet telemetry...</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-300 rounded-3xl bg-white">
          <Cpu className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Agents Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or instantiate a new agent.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card
              key={agent.id}
              className="bg-white border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                    <Cpu className="h-5 w-5" />
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                      {agent.status}
                    </Badge>
                    {agent.shared && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                        Shared
                      </span>
                    )}
                  </div>
                </div>

                <CardTitle className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {agent.name}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {agent.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Specs Pill */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Model Allocation:</span>
                    <span className="font-mono font-bold text-slate-900">{agent.model}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Temperature:</span>
                    <span className="font-mono text-slate-700">{agent.temperature}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tokens Consumed:</span>
                    <span className="font-mono text-indigo-600 font-bold">{(agent.tokensUsed / 1000).toFixed(1)}k</span>
                  </div>
                </div>

                {/* Tools attached */}
                {agent.tools && agent.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {agent.tools.map((tool, idx) => (
                      <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                        <Wrench className="h-3 w-3 text-slate-400" />
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link href={`/dashboard/chat?agentId=${agent.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold">
                      <Play className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Test Run
                    </Button>
                  </Link>

                  {role === "manager" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(agent.id, agent.status)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                        title="Toggle Active Status"
                      >
                        {agent.status === "active" ? (
                          <ToggleRight className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-slate-400" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Decommission Agent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Agent Modal (Manager Only) */}
      {modalOpen && (
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="p-6 space-y-5 bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" /> Instantiate New Agent
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Agent Name</label>
                <Input
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g. Market Intelligence Analyst"
                  className="bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <Input
                  value={newAgentDesc}
                  onChange={(e) => setNewAgentDesc(e.target.value)}
                  placeholder="e.g. Scrapes web search and computes financial stats"
                  className="bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">LLM Model</label>
                  <select
                    value={newAgentModel}
                    onChange={(e) => setNewAgentModel(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                    <option value="GPT-4o">GPT-4o</option>
                    <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Temperature ({newAgentTemp})</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newAgentTemp}
                    onChange={(e) => setNewAgentTemp(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">System Prompt</label>
                <textarea
                  rows={3}
                  value={newAgentSystem}
                  onChange={(e) => setNewAgentSystem(e.target.value)}
                  placeholder="You are an autonomous AI analyst..."
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Attach Tools</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableTools.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedTools.includes(t.id)}
                        onChange={() => handleToolCheck(t.id)}
                        className="accent-indigo-600"
                      />
                      <span className="text-[11px] font-semibold text-slate-800">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)} className="border-slate-200 text-slate-600">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating} className="bg-indigo-600 text-white font-semibold">
                  {creating ? "Instantiating..." : "Create Agent"}
                </Button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}
