"use client";

import React, { useState, useEffect } from "react";
import { 
  GitFork, Play, Plus, Trash2, Edit3, Save, 
  Settings, CheckCircle, Database, Search, 
  MessageSquare, Terminal, Clock, RefreshCw
} from "lucide-react";
import { client, Workflow, WorkflowNode, WorkflowEdge } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function WorkflowsDesigner() {
  const { success, error } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);

  // Inspector State
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [nodeConfigVal, setNodeConfigVal] = useState("");

  // Playback execution status state
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunningNodeId, setActiveRunningNodeId] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await client.getWorkflows();
        setWorkflows(data);
        if (data.length > 0) {
          setSelectedFlow(data[0]);
        }
      } catch {
        error("Initialization error", "Could not fetch workflows from registry.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectFlow = (flow: Workflow) => {
    setSelectedFlow(flow);
    setSelectedNode(null);
    setIsRunning(false);
    setActiveRunningNodeId(null);
    setExecutionLogs([]);
  };

  const handleSelectNode = (node: WorkflowNode) => {
    setSelectedNode(node);
    if (node.type === "trigger") {
      setNodeConfigVal(node.config.cron || "");
    } else if (node.type === "llm") {
      setNodeConfigVal(node.config.prompt || "");
    } else if (node.type === "code") {
      setNodeConfigVal(node.config.runtime || "");
    } else if (node.type === "search") {
      setNodeConfigVal(node.config.queries?.join(", ") || "");
    } else {
      setNodeConfigVal(node.config.channel || node.config.collection || "");
    }
  };

  const handleUpdateNodeConfig = () => {
    if (!selectedFlow || !selectedNode) return;
    
    let updatedConfig = { ...selectedNode.config };
    if (selectedNode.type === "trigger") {
      updatedConfig.cron = nodeConfigVal;
    } else if (selectedNode.type === "llm") {
      updatedConfig.prompt = nodeConfigVal;
    } else if (selectedNode.type === "code") {
      updatedConfig.runtime = nodeConfigVal;
    } else if (selectedNode.type === "search") {
      updatedConfig.queries = nodeConfigVal.split(",").map(q => q.trim());
    } else {
      updatedConfig.channel = nodeConfigVal;
      updatedConfig.collection = nodeConfigVal;
    }

    const updatedNodes = selectedFlow.nodes.map(n => 
      n.id === selectedNode.id ? { ...n, config: updatedConfig } : n
    );

    const updatedFlow = { ...selectedFlow, nodes: updatedNodes };
    setSelectedFlow(updatedFlow);
    setWorkflows(prev => prev.map(f => f.id === selectedFlow.id ? updatedFlow : f));
    setSelectedNode(null);
    success("Node Configured", `${selectedNode.name} parameter updates locally saved.`);
  };

  const handleAddNode = (type: "trigger" | "llm" | "search" | "code" | "action") => {
    if (!selectedFlow) return;

    const names = {
      trigger: "New Event Trigger",
      llm: "Claude Reasoning Node",
      search: "Semantic Vector Search",
      code: "Python Sandboxed Runner",
      action: "Alert API Hook"
    };

    const newX = 100 + (selectedFlow.nodes.length * 120) % 500;
    const newY = 120 + (selectedFlow.nodes.length * 40) % 250;
    const nodeID = `n-${Date.now()}`;
    const newNode: WorkflowNode = {
      id: nodeID,
      type,
      name: names[type],
      config: {},
      x: newX,
      y: newY
    };

    // Auto connect from last node if exists
    let newEdges = [...selectedFlow.edges];
    if (selectedFlow.nodes.length > 0) {
      const lastNode = selectedFlow.nodes[selectedFlow.nodes.length - 1];
      newEdges.push({
        id: `e-${Date.now()}`,
        source: lastNode.id,
        target: nodeID
      });
    }

    const updatedFlow = {
      ...selectedFlow,
      nodes: [...selectedFlow.nodes, newNode],
      edges: newEdges
    };

    setSelectedFlow(updatedFlow);
    setWorkflows(prev => prev.map(f => f.id === selectedFlow.id ? updatedFlow : f));
    success("Node Added", `Appended ${newNode.name} into layout.`);
  };

  const handleDeleteFlow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      await client.deleteWorkflow(id);
      const updated = workflows.filter(w => w.id !== id);
      setWorkflows(updated);
      if (updated.length > 0) {
        setSelectedFlow(updated[0]);
      } else {
        setSelectedFlow(null);
      }
      success("Workflow Purged", "DAG definition deleted successfully.");
    } catch {
      error("Purge Error", "Could not delete workflow.");
    }
  };

  const handleCreateNewWorkflow = async () => {
    const name = prompt("Enter Workflow Title:");
    if (!name) return;
    
    const newFlow: Workflow = {
      id: `flow-${Date.now()}`,
      name,
      description: "Custom multi-agent orchestration pipeline.",
      status: "draft",
      nodes: [
        { id: "tr-init", type: "trigger", name: "Hourly Event Ingestion", config: { cron: "0 * * * *" }, x: 100, y: 150 }
      ],
      edges: [],
      updated_at: new Date().toISOString().split("T")[0]
    };

    try {
      await client.saveWorkflow(newFlow);
      setWorkflows(prev => [...prev, newFlow]);
      setSelectedFlow(newFlow);
      success("Workflow Created", `Initialized DAG canvas for ${name}.`);
    } catch {
      error("Creation error", "Could not initialize flow.");
    }
  };

  const handleRunWorkflow = async () => {
    if (!selectedFlow || selectedFlow.nodes.length === 0) return;
    
    setIsRunning(true);
    setExecutionLogs(["Initializing workflow execution flow...", `DAG compiled: ${selectedFlow.nodes.length} nodes connected.`]);

    // Executed in order
    const orderedNodes = [...selectedFlow.nodes].sort((a, b) => a.x - b.x);
    
    for (let i = 0; i < orderedNodes.length; i++) {
      const node = orderedNodes[i];
      setActiveRunningNodeId(node.id);
      setExecutionLogs(prev => [...prev, `[RUNNING] Active Node: ${node.name}...`]);
      await new Promise(res => setTimeout(res, 1200));
      
      const details = {
        trigger: "Event matching positive: cron schedule evaluated.",
        llm: "Claude successfully synthesized query reasoning in 0.8s.",
        search: "Vector DB similarity search retrieved 3 matches (Avg Score: 0.91).",
        code: "Python sandbox exited with status 0 (Success).",
        action: "Published output payload successfully."
      };
      
      setExecutionLogs(prev => [...prev, `[SUCCESS] ${node.name}: ${details[node.type]}`]);
    }

    setActiveRunningNodeId(null);
    setIsRunning(false);
    setExecutionLogs(prev => [...prev, "✓ Workflow execution finished successfully."]);
    success("Run Completed", "Orchestrated flow DAG executed cleanly.");
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Rendering visual canvas engines...</p>
      </div>
    );
  }

  const nodeIcons = {
    trigger: <Clock className="h-4.5 w-4.5 text-amber-400" />,
    llm: <MessageSquare className="h-4.5 w-4.5 text-violet-400" />,
    search: <Search className="h-4.5 w-4.5 text-blue-400" />,
    code: <Terminal className="h-4.5 w-4.5 text-emerald-400" />,
    action: <CheckCircle className="h-4.5 w-4.5 text-cyan-400" />
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
            DAG Workflow Studio
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Build complex agent orchestrations by dragging, dropping, and wiring triggers and action blocks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateNewWorkflow} className="h-10 text-xs border-slate-800">
            <Plus className="h-4 w-4 mr-1.5" />
            New Studio DAG
          </Button>
          {selectedFlow && (
            <Button onClick={handleRunWorkflow} disabled={isRunning} className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 shadow-md">
              <Play className="h-4 w-4 mr-1.5" />
              Run Pipeline
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workflows side Selector */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4" glass>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <GitFork className="h-4 w-4 text-violet-400" />
              Orchestrator Flows
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {workflows.map((flow) => (
                <div
                  key={flow.id}
                  className={`group flex items-center justify-between w-full p-2.5 rounded-xl border text-left transition-all ${
                    selectedFlow?.id === flow.id 
                      ? "bg-violet-600/10 border-violet-500/30 text-slate-100" 
                      : "bg-slate-900/30 border-slate-850 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <button
                    onClick={() => handleSelectFlow(flow)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-xs font-bold truncate">{flow.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={flow.status === "published" ? "success" : "outline"} className="text-[8px] px-1 py-0">
                        {flow.status}
                      </Badge>
                      <span className="text-[9px] text-slate-500">{flow.nodes.length} nodes</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteFlow(flow.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-1 rounded hover:bg-rose-500/5 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Node addition palette */}
          {selectedFlow && (
            <Card className="p-4 space-y-2.5" glass>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5">
                Node Library
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleAddNode("trigger")} variant="outline" className="h-8 justify-start text-[10px] px-2 bg-slate-950/40 border-slate-850">
                  <Clock className="h-3.5 w-3.5 text-amber-500 mr-1 shrink-0" />
                  Trigger
                </Button>
                <Button onClick={() => handleAddNode("llm")} variant="outline" className="h-8 justify-start text-[10px] px-2 bg-slate-950/40 border-slate-850">
                  <MessageSquare className="h-3.5 w-3.5 text-violet-500 mr-1 shrink-0" />
                  Claude
                </Button>
                <Button onClick={() => handleAddNode("search")} variant="outline" className="h-8 justify-start text-[10px] px-2 bg-slate-950/40 border-slate-850">
                  <Search className="h-3.5 w-3.5 text-blue-500 mr-1 shrink-0" />
                  Search
                </Button>
                <Button onClick={() => handleAddNode("code")} variant="outline" className="h-8 justify-start text-[10px] px-2 bg-slate-950/40 border-slate-850">
                  <Terminal className="h-3.5 w-3.5 text-emerald-500 mr-1 shrink-0" />
                  Python
                </Button>
                <Button onClick={() => handleAddNode("action")} variant="outline" className="h-8 justify-start text-[10px] px-2 bg-slate-950/40 border-slate-850 col-span-2">
                  <CheckCircle className="h-3.5 w-3.5 text-cyan-500 mr-1 shrink-0" />
                  Slack / Action webhook
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Visual canvas + Inspector */}
        <div className="lg:col-span-3 space-y-6">
          {selectedFlow ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* SVG wires Canvas Area */}
              <div className="xl:col-span-2 relative min-h-[420px] bg-slate-950/40 border border-slate-900 rounded-xl overflow-hidden glassmorphism flex flex-col justify-between">
                
                {/* Dot background indicator */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

                {/* SVG connection cables */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {selectedFlow.edges.map((edge) => {
                    const sourceNode = selectedFlow.nodes.find(n => n.id === edge.source);
                    const targetNode = selectedFlow.nodes.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;
                    
                    // Simple path connection math
                    const x1 = sourceNode.x + 65; // half width approx
                    const y1 = sourceNode.y + 40; // bottom approx
                    const x2 = targetNode.x + 65;
                    const y2 = targetNode.y;
                    
                    // Generate curvy bezier line
                    const cx1 = x1;
                    const cy1 = y1 + (y2 - y1) / 2;
                    const cx2 = x2;
                    const cy2 = y2 - (y2 - y1) / 2;

                    return (
                      <path
                        key={edge.id}
                        d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                        fill="none"
                        stroke={isRunning ? "#10b981" : "#4f46e5"}
                        strokeWidth="2"
                        strokeDasharray={isRunning ? "4" : undefined}
                        className={isRunning ? "animate-pulse" : ""}
                      />
                    );
                  })}
                </svg>

                {/* Nodes rendering list */}
                <div className="relative w-full h-full min-h-[380px] z-10">
                  {selectedFlow.nodes.map((node) => {
                    const isNodeRunning = activeRunningNodeId === node.id;
                    const isSelected = selectedNode?.id === node.id;

                    return (
                      <div
                        key={node.id}
                        onClick={() => handleSelectNode(node)}
                        style={{ left: node.x, top: node.y }}
                        className={`absolute w-36 p-3 rounded-xl border cursor-pointer hover:scale-105 transition-all select-none ${
                          isNodeRunning 
                            ? "bg-emerald-950/20 border-emerald-500 shadow-lg shadow-emerald-950/40" 
                            : isSelected
                              ? "bg-violet-950/30 border-violet-500 shadow-md shadow-violet-900/35"
                              : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          {nodeIcons[node.type]}
                          <span className="text-[9px] uppercase font-bold text-slate-500">{node.type}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-200 truncate">{node.name}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-slate-950/60 border-t border-slate-900/80 z-20 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Click nodes to edit attributes</span>
                  <span>{selectedFlow.nodes.length} Nodes in graph</span>
                </div>
              </div>

              {/* Node Inspector side form */}
              <div className="space-y-4">
                {selectedNode ? (
                  <Card className="p-4" glass>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-900 pb-2">
                      <Settings className="h-4 w-4 text-violet-400" />
                      Node Parameter Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Name</p>
                        <Input 
                          value={selectedNode.name}
                          onChange={(e) => {
                            const updated = { ...selectedNode, name: e.target.value };
                            setSelectedNode(updated);
                            setSelectedFlow(prev => {
                              if (!prev) return prev;
                              return {
                                ...prev,
                                nodes: prev.nodes.map(n => n.id === selectedNode.id ? updated : n)
                              };
                            });
                          }}
                        />
                      </div>

                      {/* Config values depending on node type */}
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                          {selectedNode.type === "trigger" && "Cron Schedule Override"}
                          {selectedNode.type === "llm" && "System Prompt Override"}
                          {selectedNode.type === "code" && "Environment Runtime"}
                          {selectedNode.type === "search" && "Query Phrases (CSV)"}
                          {selectedNode.type === "action" && "Webhook Hook target"}
                        </p>
                        <textarea
                          rows={4}
                          value={nodeConfigVal}
                          onChange={(e) => setNodeConfigVal(e.target.value)}
                          className="flex w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => setSelectedNode(null)} className="flex-1 text-[10px]">
                          Cancel
                        </Button>
                        <Button type="button" size="sm" onClick={handleUpdateNodeConfig} className="flex-1 text-[10px]">
                          <Save className="h-3.5 w-3.5 mr-1" />
                          Apply Config
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-5 text-center flex flex-col items-center justify-center min-h-[140px] text-slate-500 border-dashed" glass>
                    <Settings className="h-7 w-7 text-slate-700 mb-2" />
                    <p className="text-xs">No active node highlighted.</p>
                  </Card>
                )}

                {/* Live execution logs display */}
                {executionLogs.length > 0 && (
                  <Card className="p-4 bg-black/80 font-mono text-[9px] border-slate-900" glass>
                    <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-2">
                      <span className="text-slate-400 font-bold uppercase">Pipeline execution shell</span>
                      <button onClick={() => setExecutionLogs([])} className="text-slate-600 hover:text-slate-300">Clear</button>
                    </div>
                    <div className="space-y-1 max-h-[180px] overflow-y-auto leading-relaxed">
                      {executionLogs.map((log, idx) => (
                        <p key={idx} className={log.startsWith("[SUCCESS]") ? "text-emerald-400" : log.startsWith("[RUNNING]") ? "text-amber-400" : "text-slate-400"}>
                          {log}
                        </p>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

            </div>
          ) : (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[300px] border-dashed border-slate-800" glass>
              <GitFork className="h-10 w-10 text-slate-700 mb-3" />
              <p className="text-slate-300 font-bold">No active pipelines found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">Create a new canvas workspace or select one to begin arranging agent networks.</p>
            </Card>
          )}
        </div>
      </div>
      
    </div>
  );
}
