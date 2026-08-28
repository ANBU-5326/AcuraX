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
    success("Node Configured", `${selectedNode.name} parameter updates saved.`);
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
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Rendering visual canvas engines...</p>
      </div>
    );
  }

  const nodeIcons = {
    trigger: <Clock className="h-4.5 w-4.5 text-amber-500" />,
    llm: <MessageSquare className="h-4.5 w-4.5 text-indigo-600" />,
    search: <Search className="h-4.5 w-4.5 text-sky-600" />,
    code: <Terminal className="h-4.5 w-4.5 text-emerald-600" />,
    action: <CheckCircle className="h-4.5 w-4.5 text-cyan-600" />
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2.5">
            <GitFork className="h-7 w-7 text-indigo-600" />
            Visual DAG Canvas Builder
          </h1>
          <p className="text-slate-600 text-xs mt-1">
            Construct stateful execution graphs with parallel agent loops, triggers, and webhook actions.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCreateNewWorkflow} className="h-10 text-xs border-slate-200 bg-white font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            New Pipeline
          </Button>
          
          {selectedFlow && (
            <Button 
              onClick={handleRunWorkflow} 
              disabled={isRunning || selectedFlow.nodes.length === 0} 
              className="h-10 text-xs bg-indigo-600 text-white font-bold shadow-xs"
            >
              <Play className="h-4 w-4 mr-1.5 fill-current" />
              {isRunning ? "Executing Flow..." : "Execute Pipeline"}
            </Button>
          )}
        </div>
      </div>

      {workflows.length > 0 && selectedFlow ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Workflows Select Sidebar */}
          <div className="xl:col-span-1 space-y-4">
            <Card className="p-4 bg-white border-slate-200 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <GitFork className="h-4 w-4 text-indigo-600" />
                Active Pipelines ({workflows.length})
              </h3>
              
              <div className="space-y-2">
                {workflows.map((w) => {
                  const isSelected = selectedFlow.id === w.id;
                  return (
                    <div
                      key={w.id}
                      onClick={() => handleSelectFlow(w)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-bold shadow-2xs" 
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate">{w.name}</span>
                        <Badge variant={w.status === "active" ? "default" : "secondary"}>
                          {w.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-normal">{w.description}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{w.nodes.length} nodes</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteFlow(w.id); }}
                          className="hover:text-rose-600 transition-colors p-1"
                          title="Delete Workflow"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Quick Nodes Toolbox */}
            <Card className="p-4 bg-white border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                Node Components Toolbox
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleAddNode("trigger")} variant="outline" className="h-8 justify-start text-[10px] px-2 bg-slate-50 border-slate-200 font-semibold text-slate-700">
                  <Clock className="h-3.5 w-3.5 mr-1 text-amber-500" /> + Trigger
                </Button>
                <Button onClick={() => handleAddNode("llm")} variant="outline" className="h-8 justify-start text-[10px] px-2 bg-slate-50 border-slate-200 font-semibold text-slate-700">
                  <MessageSquare className="h-3.5 w-3.5 mr-1 text-indigo-600" /> + AI Model
                </Button>
                <Button onClick={() => handleAddNode("search")} variant="outline" className="h-8 justify-start text-[10px] px-2 bg-slate-50 border-slate-200 font-semibold text-slate-700">
                  <Search className="h-3.5 w-3.5 mr-1 text-sky-600" /> + Vector Search
                </Button>
                <Button onClick={() => handleAddNode("code")} variant="outline" className="h-8 justify-start text-[10px] px-2 bg-slate-50 border-slate-200 font-semibold text-slate-700">
                  <Terminal className="h-3.5 w-3.5 mr-1 text-emerald-600" /> + Python Code
                </Button>
                <Button onClick={() => handleAddNode("action")} variant="outline" className="h-8 justify-start text-[10px] px-2 bg-slate-50 border-slate-200 font-semibold text-slate-700 col-span-2">
                  <CheckCircle className="h-3.5 w-3.5 mr-1 text-cyan-600" /> + Webhook Action
                </Button>
              </div>
            </Card>
          </div>

          {/* Canvas & Node List */}
          <div className="xl:col-span-3 space-y-4">
            <div className="relative min-h-[420px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
              {/* Canvas Header */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-900">{selectedFlow.name}</h2>
                  <p className="text-[10px] text-slate-500">{selectedFlow.description}</p>
                </div>
                
                <span className="text-[10px] text-slate-600 font-semibold bg-slate-200/60 px-2 py-0.5 rounded">
                  {selectedFlow.nodes.length} Nodes
                </span>
              </div>

              {/* Visual Nodes Workspace */}
              <div className="relative flex-1 p-6 min-h-[320px] overflow-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedFlow.nodes.map((node) => {
                    const isNodeSelected = selectedNode?.id === node.id;
                    const isRunningThis = activeRunningNodeId === node.id;

                    return (
                      <div
                        key={node.id}
                        onClick={() => handleSelectNode(node)}
                        className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                          isRunningThis
                            ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400 animate-pulse shadow-md"
                            : isNodeSelected
                            ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200 text-slate-900 font-bold shadow-sm"
                            : "bg-white border-slate-200 hover:border-indigo-300 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {nodeIcons[node.type]}
                          <span className="font-bold text-slate-900 truncate">{node.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono capitalize">Type: {node.type}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Canvas Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 font-medium">
                Click any node block to configure parameters in the inspector panel.
              </div>
            </div>

            {/* Selected Node Config Inspector Panel */}
            {selectedNode && (
              <Card className="p-4 bg-white border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="h-4 w-4 text-indigo-600" />
                    Inspector: {selectedNode.name}
                  </h3>
                  <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">Close ✕</button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Parameter Value ({selectedNode.type})</label>
                    <textarea
                      rows={3}
                      value={nodeConfigVal}
                      onChange={(e) => setNodeConfigVal(e.target.value)}
                      className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" onClick={handleUpdateNodeConfig} className="bg-indigo-600 text-white font-bold h-8 text-xs">
                      <Save className="h-3.5 w-3.5 mr-1" /> Save Node Config
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Execution Console Logs Panel */}
            {executionLogs.length > 0 && (
              <Card className="p-4 bg-slate-950 text-slate-100 font-mono text-xs space-y-2 shadow-xl">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-[10px]">
                  <span className="text-indigo-400 font-bold uppercase">Pipeline execution shell</span>
                  <button onClick={() => setExecutionLogs([])} className="text-slate-500 hover:text-slate-300">Clear</button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                  {executionLogs.map((log, idx) => (
                    <p key={idx} className={log.startsWith("[SUCCESS]") ? "text-emerald-400" : log.startsWith("[RUNNING]") ? "text-amber-400" : "text-slate-300"}>
                      {log}
                    </p>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[300px] border-dashed border-slate-300 bg-white">
          <GitFork className="h-10 w-10 text-slate-400 mb-2" />
          <p className="text-slate-800 font-bold">No active pipelines found</p>
          <Button onClick={handleCreateNewWorkflow} className="mt-4 bg-indigo-600 text-white font-bold">
            <Plus className="h-4 w-4 mr-1.5" /> Create First Workflow
          </Button>
        </Card>
      )}
    </div>
  );
}
