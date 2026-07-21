"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Send, Cpu, User, Bot, Sparkles, RefreshCw, 
  Terminal, Search, Settings, Code, ChevronRight,
  Plus, Trash2, Paperclip, ChevronDown, BookOpen,
  FileText, ExternalLink, MessageSquare, X,
  ArrowLeft, Clock, CornerDownLeft
} from "lucide-react";
import { client, Agent } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ── Shared Types ─────────────────────────────────────────────────────────────

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  agentName?: string;
  trace?: {
    tool: string;
    query?: string;
    result: string;
  }[];
  sources?: string[]; // Names of cited documents
}

interface SavedChat {
  id: string;
  title: string;
  lastActive: string;
  lastQuestion: string;
  messages: Message[];
}

// ── Mock Document content for preview ────────────────────────────────────────

const MOCK_DOCS: Record<string, { title: string; content: string; category: string }> = {
  "Remote Work & Flexible Hours Policy": {
    title: "Remote Work & Flexible Hours Policy",
    category: "HR Policies",
    content: `AcuraX supports flexible working arrangements for eligible employees.
Core Hours: All employees are expected to be reachable between 10:00 AM – 3:00 PM in their local timezone. Outside these hours, flexible scheduling applies.
Equipment Reimbursement:
- Monitor: Up to $400 reimbursed upon HR approval
- Keyboard & Mouse: Up to $100
- Desk Chair: Up to $300
- Home Internet: $50/month stipend`
  },
  "Getting Started with AcuraX Playground": {
    title: "Getting Started with AcuraX Playground",
    category: "Onboarding",
    content: `The Playground is your main workspace for interacting with AI agents.
Step 1: Choose an Agent from the Playground Chat view.
Step 2: Write your query in the message box. Citing sources from your company's document library is supported.
Step 3: Read the response and click on citations to inspect policy documents.`
  },
  "How to Reset Your Password": {
    title: "How to Reset Your Password",
    category: "IT Support",
    content: `Self-Service Reset (Recommended):
1. Go to https://auth.acurax.ai/reset
2. Enter your company email address.
3. Check inbox for a reset link (expires in 15 minutes).
4. Enter new password (minimum 12 characters, uppercase, number, symbol).`
  },
  "Leave & Time-Off Request Process": {
    title: "Leave & Time-Off Request Process",
    category: "HR Policies",
    content: `AcuraX offers:
- Annual Leave: 20 days per year (carry up to 5 days into next year).
- Sick Leave: 12 days (doctor's note required after 3 days).
- Maternity/Paternity: 90 / 30 days.
Submit requests via HR Portal at hr.acurax.ai.`
  },
  "VPN Setup & Secure Remote Access": {
    title: "VPN Setup & Secure Remote Access",
    category: "IT Support",
    content: `The AcuraX VPN secures your connection to internal tools.
1. Download client from https://it.acurax.ai/vpn
2. Set server address to vpn.acurax.ai
3. Log in with your email and password.
4. Verify using Authenticator MFA push notification.`
  },
  "Employee Expense Reimbursement Guide": {
    title: "Employee Expense Reimbursement Guide",
    category: "Guides",
    content: `AcuraX reimburses reasonable expenses:
- Travel: flights/hotels (up to $200/night).
- Client meals: up to $75/person.
- Software: up to $50/month (pre-approval needed for higher).
Submit claims via expenses.acurax.ai within 30 days.`
  }
};

// ── Markdown Parser ──────────────────────────────────────────────────────────

function renderFormattedMessage(text: string) {
  if (!text) return null;

  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith("```")) {
      const code = part.replace(/```[a-zA-Z]*\n?/, "").replace(/```$/, "");
      return (
        <pre key={index} className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[10.5px] text-violet-300 my-2 overflow-x-auto">
          <code>{code}</code>
        </pre>
      );
    }

    const lines = part.split("\n");
    return lines.map((line, lineIdx) => {
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const content = line.trim().substring(2).split(/\*\*(.*?)\*\*/g);
        return (
          <li key={`${lineIdx}`} className="list-disc ml-4 my-1 text-xs text-slate-350 leading-relaxed">
            {content.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-slate-100 font-semibold">{p}</strong> : p)}
          </li>
        );
      }

      if (line.trim() === "") {
        return <div key={`${lineIdx}`} className="h-2" />;
      }

      const content = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={`${lineIdx}`} className="text-xs leading-relaxed mb-1.5 text-slate-300">
          {content.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-slate-100 font-semibold">{p}</strong> : p)}
        </p>
      );
    });
  });
}

// ── Manager Chat Playground (Original) ────────────────────────────────────────

function ManagerChatPlayground() {
  const { error } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-init",
      sender: "assistant",
      text: "System initialized. Select an agent from the configuration panel to begin prompting.",
      timestamp: "System",
      agentName: "Acura Console"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activeTrace, setActiveTrace] = useState<string | null>(null);
  
  const [temperature, setTemperature] = useState(0.4);
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  const [enableSandbox, setEnableSandbox] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await client.getAgents();
        const active = data.filter(a => a.status === "active");
        setAgents(active);
        if (active.length > 0) {
          setSelectedAgent(active[0]);
          setTemperature(active[0].temperature);
          setMessages([
            {
              id: "m-greeting",
              sender: "assistant",
              text: `Hello! I am ${active[0].name}, running ${active[0].model}. I have access to tools. How can I help you today?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              agentName: active[0].name
            }
          ]);
        }
      } catch {
        error("Initialization Error", "Failed to contact local agent registry.");
      }
    }
    load();
  }, [error]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, activeTrace]);

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setTemperature(agent.temperature);
    setMessages([
      {
        id: `m-greet-${agent.id}`,
        sender: "assistant",
        text: `Switched context to ${agent.name}. Instructions and parameters synced.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: agent.name
      }
    ]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedAgent) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setThinking(true);

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step === 1 && enableWebSearch && selectedAgent.tools.includes("web_search")) {
        setActiveTrace("Executing web query: Searching semantic stores for matching query...");
      } else if (step === 2 && enableSandbox && selectedAgent.tools.includes("python_sandbox")) {
        setActiveTrace("Compiling Python script: Running sandbox calculations in isolated environment...");
      } else {
        clearInterval(interval);
        setActiveTrace(null);
        
        const mockResponses: Record<string, string> = {
          "agent-1": `Based on the latest semantic index results for AcuraX, the multi-agent routing loop handles tasks correctly. I found that the orchestrator compiles flows into serialized graphs prior to running Python sandbox environments. Is there a specific workflow node you would like to run?`,
          "agent-2": `I have run the calculations in the sandbox. The optimization output shows a decrease in latency of 34% by caching the similarity lookup values in the pgvector database. Here is the corresponding Python logic:\n\n\`\`\`python\ndef optimize_embeddings(data):\n    # Cached similarity scoring logic\n    return sorted(data, key=lambda x: x['score'], reverse=True)\n\`\`\``,
          "agent-default": "The model has processed your request successfully in the AcuraX sandbox environment. No anomalies detected."
        };

        const responseText = mockResponses[selectedAgent.id] || mockResponses["agent-default"];
        let charIndex = 0;
        const msgId = `a-${Date.now()}`;
        
        setMessages((prev) => [
          ...prev,
          {
            id: msgId,
            sender: "assistant",
            text: "",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agentName: selectedAgent.name,
            trace: enableWebSearch && selectedAgent.tools.includes("web_search") ? [
              { tool: "web_search", query: "AcuraX system parameters", result: "Found 4 documents inside pgvector storage." }
            ] : undefined
          }
        ]);

        setThinking(false);

        const typeInterval = setInterval(() => {
          if (charIndex < responseText.length) {
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === msgId 
                  ? { ...msg, text: responseText.slice(0, charIndex + 2) } 
                  : msg
              )
            );
            charIndex += 2;
          } else {
            clearInterval(typeInterval);
            const addedTokens = responseText.length * 2;
            client.updateAgent(selectedAgent.id, { tokensUsed: selectedAgent.tokensUsed + addedTokens });
          }
        }, 12);
      }
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col lg:flex-row gap-6 animate-fade-in">
      <div className="flex-1 flex flex-col bg-slate-900/10 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="px-6 py-4 border-b border-slate-900 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${selectedAgent?.avatarColor || "from-slate-700 to-slate-800"} flex items-center justify-center border border-white/5`}>
              <Bot className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">{selectedAgent?.name || "No Active Agent"}</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">{selectedAgent?.model || "Select an agent from the side panel"}</p>
            </div>
          </div>
          <Badge variant="success" className="text-[10px] uppercase tracking-wider font-bold">Manager Mode</Badge>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div key={msg.id} className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : ""}`}>
                <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs border ${
                  isUser ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-violet-650/15 border-violet-500/20 text-violet-400"
                }`}>
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{isUser ? "You" : msg.agentName}</span>
                    <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                  </div>
                  
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                    isUser ? "bg-violet-600/15 border-violet-500/20 text-violet-100 rounded-tr-none" : "bg-slate-900/60 border-slate-800 text-slate-350 rounded-tl-none"
                  }`}>
                    {isUser ? <p className="whitespace-pre-wrap">{msg.text}</p> : renderFormattedMessage(msg.text)}
                    
                    {msg.trace && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                        {msg.trace.map((tr, idx) => (
                          <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-900/80 font-mono text-[10px]">
                            <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                              <Terminal className="h-3.5 w-3.5" />
                              <span>Tool Call: {tr.tool}</span>
                            </div>
                            {tr.query && <p className="text-slate-400 mt-1">Args: {tr.query}</p>}
                            <p className="text-slate-500 mt-0.5">Stdout: {tr.result}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {thinking && (
            <div className="flex gap-3 max-w-2xl">
              <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-violet-650/15 border border-violet-500/20 text-violet-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-250">{selectedAgent?.name}</span>
                  <span className="text-[9px] text-slate-500">Processing...</span>
                </div>
                <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 text-violet-500 animate-spin" />
                  <span className="text-xs text-slate-400">Analyzing sandbox metrics...</span>
                </div>
              </div>
            </div>
          )}

          {activeTrace && (
            <div className="flex gap-3 max-w-2xl animate-pulse ml-11">
              <div className="p-3 bg-slate-950 border border-slate-900 font-mono text-[10px] rounded-xl flex items-center gap-2.5 text-amber-500/90 w-full">
                <Code className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
                <span className="truncate">{activeTrace}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 bg-slate-950/60 flex gap-3">
          <Input
            placeholder={selectedAgent ? `Prompt ${selectedAgent.name}...` : "Select an agent to begin"}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!selectedAgent || thinking}
            className="flex-1 bg-slate-950 border-slate-850 h-11 focus-visible:ring-violet-500/50"
          />
          <Button type="submit" disabled={!selectedAgent || thinking || !inputText.trim()} size="icon" className="h-11 w-11 shrink-0 rounded-lg">
            <Send className="h-4.5 w-4.5" />
          </Button>
        </form>
      </div>

      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
        <div className="bg-slate-900/10 border border-white/5 rounded-xl p-5 flex flex-col max-h-[300px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-900 pb-2">
            <Cpu className="h-4 w-4 text-violet-400" />
            Active Agents
          </h3>
          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => handleAgentSelect(a)}
                className={`flex items-center gap-2.5 w-full p-2.5 rounded-xl border text-left transition-all ${
                  selectedAgent?.id === a.id 
                    ? "bg-violet-600/10 border-violet-500/30 text-slate-100" 
                    : "bg-slate-900/30 border-slate-850 text-slate-400 hover:border-slate-800"
                }`}
              >
                <div className={`h-6.5 w-6.5 rounded-md bg-gradient-to-tr ${a.avatarColor} flex items-center justify-center shrink-0 border border-white/5 font-bold text-[10px] text-white`}>
                  {a.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{a.name}</p>
                  <p className="text-[9px] text-slate-500 truncate">{a.model}</p>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/10 border border-white/5 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-2">
            <Settings className="h-4 w-4 text-violet-400" />
            Execution Overrides
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Model Temperature</span>
              <span className="text-violet-400">{temperature}</span>
            </div>
            <input 
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              disabled={!selectedAgent}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-violet-600 border border-slate-800 disabled:opacity-50"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Real-time Web Search</span>
                <span className="text-[9px] text-slate-500 block">Retrieve queries in playground</span>
              </div>
              <input
                type="checkbox"
                checked={enableWebSearch}
                onChange={(e) => setEnableWebSearch(e.target.checked)}
                disabled={!selectedAgent || !selectedAgent.tools.includes("web_search")}
                className="h-4 w-4 rounded border-slate-800 text-violet-600 bg-slate-900 focus:ring-violet-500/50 cursor-pointer disabled:opacity-40"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Isolated Exec Sandbox</span>
                <span className="text-[9px] text-slate-500 block">Evaluate math and python scripts</span>
              </div>
              <input
                type="checkbox"
                checked={enableSandbox}
                onChange={(e) => setEnableSandbox(e.target.checked)}
                disabled={!selectedAgent || !selectedAgent.tools.includes("python_sandbox")}
                className="h-4 w-4 rounded border-slate-800 text-violet-600 bg-slate-900 focus:ring-violet-500/50 cursor-pointer disabled:opacity-40"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Employee Chat Playground (New Two-Column Layout) ─────────────────────────

function EmployeeChatPlayground() {
  const { success, error } = useToast();
  
  // Storage keys
  const STORAGE_KEY = "acurax_chats";

  const [chats, setChats] = useState<SavedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [previewDocKey, setPreviewDocKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize and load chats
  useEffect(() => {
    async function load() {
      try {
        const backendChats = await client.getChats();
        const loadedChats: SavedChat[] = await Promise.all(
          backendChats.map(async (bc: any) => {
            try {
              const messages = await client.getChatMessages(bc.id);
              const mappedMessages = messages.map((m: any) => {
                let sources: string[] = [];
                const norm = m.content.toLowerCase();
                if (norm.includes("leave") || norm.includes("pto") || norm.includes("vacation") || norm.includes("time off")) {
                  sources = ["Leave & Time-Off Request Process"];
                } else if (norm.includes("vpn") || norm.includes("secure") || norm.includes("remote access")) {
                  sources = ["VPN Setup & Secure Remote Access"];
                } else if (norm.includes("password") || norm.includes("reset")) {
                  sources = ["How to Reset Your Password"];
                } else if (norm.includes("remote") || norm.includes("flex") || norm.includes("wfh")) {
                  sources = ["Remote Work & Flexible Hours Policy"];
                } else if (norm.includes("expense") || norm.includes("reimburse") || norm.includes("claim")) {
                  sources = ["Employee Expense Reimbursement Guide"];
                } else if (norm.includes("onboarding") || norm.includes("playground") || norm.includes("getting started")) {
                  sources = ["Getting Started with AcuraX Playground"];
                }
                return {
                  id: m.id,
                  sender: m.role === "user" ? "user" : "assistant",
                  text: m.content,
                  timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  sources: sources.length > 0 ? sources : undefined
                };
              });
              return {
                id: bc.id,
                title: bc.title,
                lastActive: new Date(bc.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                lastQuestion: messages.filter((m: any) => m.role === "user").pop()?.content || "",
                messages: mappedMessages
              };
            } catch {
              return {
                id: bc.id,
                title: bc.title,
                lastActive: new Date(bc.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                lastQuestion: "",
                messages: []
              };
            }
          })
        );

        setChats(loadedChats);
        const urlParams = new URLSearchParams(window.location.search);
        const qChatId = urlParams.get("chatId");
        if (qChatId && loadedChats.some(c => c.id === qChatId)) {
          setActiveChatId(qChatId);
        } else if (loadedChats.length > 0) {
          setActiveChatId(loadedChats[0].id);
        }
      } catch (err) {
        console.warn("Backend chat fetch failed, falling back to local storage:", err);
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(STORAGE_KEY);
          let parsedChats: SavedChat[] = [];
          if (stored) {
            try {
              parsedChats = JSON.parse(stored);
            } catch (e) {
              console.error("Failed to parse local chats", e);
            }
          } else {
            parsedChats = [
              {
                id: "chat-1",
                title: "Remote Work & Flexible Hours Policy",
                lastActive: "10:32 AM",
                lastQuestion: "Summarise Q3 strategic plan highlights",
                messages: [
                  { id: "m1", sender: "user", text: "Summarise Q3 strategic plan highlights", timestamp: "10:30 AM" },
                  {
                    id: "m2",
                    sender: "assistant",
                    text: "Here is a summary of the Q3 strategic plan remote expectations:\n- Core hours: reachable **10:00 AM – 3:00 PM** local timezone.\n- Hardware budget: reimbursed up to **$400** for monitor, **$100** for accessories.\n- Home internet: **$50/month** stipend.\n\nAll eligibility rules are documented in the **Remote Work & Flexible Hours Policy**.",
                    timestamp: "10:32 AM",
                    sources: ["Remote Work & Flexible Hours Policy"]
                  }
                ]
              },
              {
                id: "chat-2",
                title: "Getting Started with AcuraX Playground",
                lastActive: "09:55 AM",
                lastQuestion: "Compare competitor pricing in APAC",
                messages: [
                  { id: "m3", sender: "user", text: "Compare competitor pricing in APAC", timestamp: "09:52 AM" },
                  {
                    id: "m4",
                    sender: "assistant",
                    text: "Comparing APAC pricing models:\n- Competitor A: $29/user/month (basic support)\n- Competitor B: $45/user/month (includes advanced security integrations)\n\nAcuraX core agents provide tools to crawl web directories and retrieve local parameters dynamically. Refer to **Getting Started with AcuraX Playground** to set up a market query.",
                    timestamp: "09:55 AM",
                    sources: ["Getting Started with AcuraX Playground"]
                  }
                ]
              },
              {
                id: "chat-3",
                title: "How to Reset Your Password",
                lastActive: "Yesterday",
                lastQuestion: "Generate a Python script to parse CSV",
                messages: [
                  { id: "m5", sender: "user", text: "Generate a Python script to parse CSV", timestamp: "Yesterday" },
                  {
                    id: "m6",
                    sender: "assistant",
                    text: "Here is the code script requested:\n\n```python\nimport csv\n\ndef parse_acurax_csv(filepath):\n    with open(filepath, mode='r') as file:\n        reader = csv.DictReader(file)\n        return [row for row in reader]\n```\n\nTo update settings or reset authentication keys, please see **How to Reset Your Password** for details.",
                    timestamp: "Yesterday",
                    sources: ["How to Reset Your Password"]
                  }
                ]
              },
              {
                id: "chat-4",
                title: "Leave & Time-Off Request Process",
                lastActive: "Yesterday",
                lastQuestion: "What are the embedding model options?",
                messages: [
                  { id: "m7", sender: "user", text: "What are the embedding model options?", timestamp: "Yesterday" },
                  {
                    id: "m8",
                    sender: "assistant",
                    text: "AcuraX defaults to standard text-embedding-ada-002 or text-embedding-3-small. These compile document chunks into pgvector formats.\n\nNote: If requesting leave for training or study regarding AI systems, consult the **Leave & Time-Off Request Process** for eligibility rules.",
                    timestamp: "Yesterday",
                    sources: ["Leave & Time-Off Request Process"]
                  }
                ]
              },
              {
                id: "chat-5",
                title: "VPN Setup & Secure Remote Access",
                lastActive: "Monday",
                lastQuestion: "Explain pgvector vs Pinecone",
                messages: [
                  { id: "m9", sender: "user", text: "Explain pgvector vs Pinecone", timestamp: "Monday" },
                  {
                    id: "m10",
                    sender: "assistant",
                    text: "Core difference:\n- **pgvector**: Local postgres extension, secure, keeps credentials behind company firewall.\n- **Pinecone**: Cloud-native SaaS database.\n\nEnsure you connect to the company VPN to access PGVector endpoints. Follow instructions in **VPN Setup & Secure Remote Access**.",
                    timestamp: "Monday",
                    sources: ["VPN Setup & Secure Remote Access"]
                  }
                ]
              }
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedChats));
          }
          setChats(parsedChats);
          const urlParams = new URLSearchParams(window.location.search);
          const qChatId = urlParams.get("chatId");
          if (qChatId && parsedChats.some(c => c.id === qChatId)) {
            setActiveChatId(qChatId);
          } else if (parsedChats.length > 0) {
            setActiveChatId(parsedChats[0].id);
          }
        }
      }
    }
    load();
  }, []);

  // Save chats changes to localStorage
  const saveChats = useCallback((updated: SavedChat[]) => {
    setChats(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Also sync the home page recent activity
    localStorage.setItem("acurax_chats", JSON.stringify(updated));
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChatId, thinking]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Handle pending prompt from documents or other pages
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pending = localStorage.getItem("acurax_pending_prompt");
      if (pending && chats.length > 0) {
        localStorage.removeItem("acurax_pending_prompt");
        
        // Create a new chat for this query
        const newId = `chat-${Date.now()}`;
        const newChat: SavedChat = {
          id: newId,
          title: pending.length > 35 ? pending.substring(0, 35) + "..." : pending,
          lastActive: "Just now",
          lastQuestion: pending,
          messages: [
            {
              id: `u-${Date.now()}`,
              sender: "user",
              text: pending,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
        
        const updated = [newChat, ...chats];
        saveChats(updated);
        setActiveChatId(newId);
        setThinking(true);
        
        // Trigger AI reply simulation
        setTimeout(() => {
          let reply = "I have checked the AcuraX knowledge base. For specific inquiries, please consult the relevant policy document or contact your department lead.";
          let sources: string[] = [];

          const query = pending;
          const normalized = query.toLowerCase();
          if (normalized.includes("pto") || normalized.includes("leave") || normalized.includes("vacation") || normalized.includes("time off")) {
            reply = "Under our **Leave & Time-Off Policy**, full-time employees are eligible for **20 days of Annual Leave** per year. You can carry over up to **5 days** of unused leave into the following year. Sick leave provides **12 days** annually, and a doctor's note is required if you are off for more than 3 consecutive days. Submissions can be sent online at hr.acurax.ai.";
            sources = ["Leave & Time-Off Request Process"];
          } else if (normalized.includes("vpn") || normalized.includes("secure") || normalized.includes("remote access") || normalized.includes("connect")) {
            reply = "To establish a secure remote connection, you must download the VPN client from the IT Portal: **https://it.acurax.ai/vpn**. The client supports Windows, macOS, and Linux. Once installed, configure the server target to **vpn.acurax.ai** and verify the login credentials with your Microsoft/Google Authenticator MFA device.";
            sources = ["VPN Setup & Secure Remote Access"];
          } else if (normalized.includes("password") || normalized.includes("reset")) {
            reply = "You can easily reset your company password using our self-service authentication portal at **https://auth.acurax.ai/reset**. Simply enter your corporate email, retrieve the reset link, and choose a password that is at least **12 characters long** containing uppercase, numbers, and symbols. Passwords expire automatically every **90 days**.";
            sources = ["How to Reset Your Password"];
          } else if (normalized.includes("remote") || normalized.includes("flex") || normalized.includes("wfh") || normalized.includes("work from home")) {
            reply = "Our remote guidelines support flexible working hours. Eligible employees are expected to be online and reachable during our core hours: **10:00 AM – 3:00 PM** local timezone. We reimburse equipment costs up to **$400** for a monitor, **$100** for keyboards/mice, and **$300** for workspace chairs. Home internet stipends are paid at **$50/month**.";
            sources = ["Remote Work & Flexible Hours Policy"];
          } else if (normalized.includes("expense") || normalized.includes("reimburse") || normalized.includes("claim")) {
            reply = "Business-related expense reports should be filed within **30 days** of purchase on **expenses.acurax.ai**. Client meals are covered up to **$75/person**, business travel lodging is covered up to **$200/night**, and software subscriptions are pre-approved up to **$50/month**. Make sure to upload receipt PDFs or photos for verification.";
            sources = ["Employee Expense Reimbursement Guide"];
          } else if (normalized.includes("onboarding") || normalized.includes("new hire") || normalized.includes("first week")) {
            reply = "Welcome! During your first week, you must complete your security training, set up your VPN, introduce yourself in Slack **#team-general**, and align on your 30-60-90 day timeline with your manager. See **Getting Started with AcuraX Playground** or contact hr@acurax.ai for questions.";
            sources = ["Getting Started with AcuraX Playground"];
          }

          const aiMsg: Message = {
            id: `a-${Date.now()}`,
            sender: "assistant",
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: sources.length > 0 ? sources : undefined
          };

          // Append assistant message
          setChats(prev => {
            const final = prev.map(c => c.id === newId ? { ...c, messages: [...c.messages, aiMsg] } : c);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
            localStorage.setItem("acurax_chats", JSON.stringify(final));
            return final;
          });
          setThinking(false);
        }, 1200);
      }
    }
  }, [chats, saveChats]);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Create a new empty chat
  const handleNewChat = async () => {
    try {
      const bc = await client.createChat("New Conversation");
      const newChat: SavedChat = {
        id: bc.id,
        title: bc.title,
        lastActive: "Just now",
        lastQuestion: "",
        messages: []
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(bc.id);
      setInputText("");
      if (textareaRef.current) textareaRef.current.focus();
    } catch {
      const newId = `chat-${Date.now()}`;
      const newChat: SavedChat = {
        id: newId,
        title: "New Conversation",
        lastActive: "Just now",
        lastQuestion: "",
        messages: []
      };
      const updated = [newChat, ...chats];
      saveChats(updated);
      setActiveChatId(newId);
      setInputText("");
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  // Delete chat history
  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await client.deleteChat(id);
    } catch (err) {
      console.warn("Failed to delete chat from backend, deleting locally:", err);
    }
    const updated = chats.filter(c => c.id !== id);
    saveChats(updated);
    if (activeChatId === id) {
      if (updated.length > 0) {
        setActiveChatId(updated[0].id);
      } else {
        setActiveChatId(null);
      }
    }
    success("Conversation Deleted", "The chat history was successfully removed.");
  };

  // Submit prompt
  const handleSendPrompt = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || !activeChatId) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update messages in active chat (optimistic update)
    setChats(prev => prev.map((c) => {
      if (c.id === activeChatId) {
        const isFirst = c.messages.length === 0;
        return {
          ...c,
          title: isFirst ? (query.length > 35 ? query.substring(0, 35) + "..." : query) : c.title,
          lastActive: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lastQuestion: query,
          messages: [...c.messages, userMsg]
        };
      }
      return c;
    }));

    setInputText("");
    setThinking(true);

    try {
      // Send chat message to backend
      const assistantReply = await client.sendChatMessage(activeChatId, query);
      const dbMsgs = await client.getChatMessages(activeChatId);
      
      setChats(prev => prev.map((c) => {
        if (c.id === activeChatId) {
          const mappedMessages = dbMsgs.map((m: any) => {
            let sources: string[] = [];
            const norm = m.content.toLowerCase();
            if (norm.includes("leave") || norm.includes("pto") || norm.includes("vacation") || norm.includes("time off")) {
              sources = ["Leave & Time-Off Request Process"];
            } else if (norm.includes("vpn") || norm.includes("secure") || norm.includes("remote access")) {
              sources = ["VPN Setup & Secure Remote Access"];
            } else if (norm.includes("password") || norm.includes("reset")) {
              sources = ["How to Reset Your Password"];
            } else if (norm.includes("remote") || norm.includes("flex") || norm.includes("wfh")) {
              sources = ["Remote Work & Flexible Hours Policy"];
            } else if (norm.includes("expense") || norm.includes("reimburse") || norm.includes("claim")) {
              sources = ["Employee Expense Reimbursement Guide"];
            } else if (norm.includes("onboarding") || norm.includes("playground") || norm.includes("getting started")) {
              sources = ["Getting Started with AcuraX Playground"];
            }
            return {
              id: m.id,
              sender: m.role === "user" ? "user" : "assistant",
              text: m.content,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: sources.length > 0 ? sources : undefined
            };
          });
          return {
            ...c,
            title: c.title === "New Conversation" ? (query.length > 35 ? query.substring(0, 35) + "..." : query) : c.title,
            messages: mappedMessages
          };
        }
        return c;
      }));
      setThinking(false);
    } catch (err) {
      console.warn("Backend chat send failed, falling back to local simulation:", err);
      // Simulate AI response logic (original fallback)
      setTimeout(() => {
        let reply = "I have checked the AcuraX knowledge base. For specific inquiries, please consult the relevant policy document or contact your department lead.";
        let sources: string[] = [];

        const normalized = query.toLowerCase();
        if (normalized.includes("pto") || normalized.includes("leave") || normalized.includes("vacation") || normalized.includes("time off")) {
          reply = "Under our **Leave & Time-Off Policy**, full-time employees are eligible for **20 days of Annual Leave** per year. You can carry over up to **5 days** of unused leave into the following year. Sick leave provides **12 days** annually, and a doctor's note is required if you are off for more than 3 consecutive days. Submissions can be sent online at hr.acurax.ai.";
          sources = ["Leave & Time-Off Request Process"];
        } else if (normalized.includes("vpn") || normalized.includes("secure") || normalized.includes("remote access") || normalized.includes("connect")) {
          reply = "To establish a secure remote connection, you must download the VPN client from the IT Portal: **https://it.acurax.ai/vpn**. The client supports Windows, macOS, and Linux. Once installed, configure the server target to **vpn.acurax.ai** and verify the login credentials with your Microsoft/Google Authenticator MFA device.";
          sources = ["VPN Setup & Secure Remote Access"];
        } else if (normalized.includes("password") || normalized.includes("reset")) {
          reply = "You can easily reset your company password using our self-service authentication portal at **https://auth.acurax.ai/reset**. Simply enter your corporate email, retrieve the reset link, and choose a password that is at least **12 characters long** containing uppercase, numbers, and symbols. Passwords expire automatically every **90 days**.";
          sources = ["How to Reset Your Password"];
        } else if (normalized.includes("remote") || normalized.includes("flex") || normalized.includes("wfh") || normalized.includes("work from home")) {
          reply = "Our remote guidelines support flexible working hours. Eligible employees are expected to be online and reachable during our core hours: **10:00 AM – 3:00 PM** local timezone. We reimburse equipment costs up to **$400** for a monitor, **$100** for keyboards/mice, and **$300** for workspace chairs. Home internet stipends are paid at **$50/month**.";
          sources = ["Remote Work & Flexible Hours Policy"];
        } else if (normalized.includes("expense") || normalized.includes("reimburse") || normalized.includes("claim")) {
          reply = "Business-related expense reports should be filed within **30 days** of purchase on **expenses.acurax.ai**. Client meals are covered up to **$75/person**, business travel lodging is covered up to **$200/night**, and software subscriptions are pre-approved up to **$50/month**. Make sure to upload receipt PDFs or photos for verification.";
          sources = ["Employee Expense Reimbursement Guide"];
        } else if (normalized.includes("onboarding") || normalized.includes("new hire") || normalized.includes("first week")) {
          reply = "Welcome! During your first week, you must complete your security training, set up your VPN, introduce yourself in Slack **#team-general**, and align on your 30-60-90 day timeline with your manager. See **Getting Started with AcuraX Playground** or contact hr@acurax.ai for questions.";
          sources = ["Getting Started with AcuraX Playground"];
        }

        const aiMsg: Message = {
          id: `a-${Date.now()}`,
          sender: "assistant",
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: sources.length > 0 ? sources : undefined
        };

        setChats(prev => prev.map((c) => {
          if (c.id === activeChatId) {
            return {
              ...c,
              messages: [...c.messages, aiMsg]
            };
          }
          return c;
        }));
        setThinking(false);
      }, 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const filteredChats = chats.filter((c) => {
    const q = searchQuery.toLowerCase();
    return !q || c.title.toLowerCase().includes(q) || c.lastQuestion.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6 animate-fade-in">
        
        {/* LEFT SIDEBAR: Chat History (280px) */}
        <div className="w-full md:w-[280px] shrink-0 flex flex-col bg-slate-900/10 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md">
          {/* New Chat CTA */}
          <div className="p-4 border-b border-slate-900 bg-slate-950/20">
            <Button 
              onClick={handleNewChat}
              className="w-full h-10 text-xs font-bold bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white transition-all shadow-md shadow-violet-900/15"
              aria-label="Create a new chat conversation"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Chat
            </Button>
          </div>

          {/* Search bar */}
          <div className="px-4 py-2 border-b border-slate-900 bg-slate-950/20 relative">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-350 focus:outline-none focus:ring-1 focus:ring-violet-550"
            />
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-1">
                <MessageSquare className="h-5 w-5 mx-auto opacity-40 text-slate-600" />
                <p className="text-[10px] font-semibold">No chats found</p>
              </div>
            ) : (
              filteredChats.map((c) => {
                const isActive = c.id === activeChatId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveChatId(c.id)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveChatId(c.id); }}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border border-transparent",
                      isActive 
                        ? "bg-violet-600/15 border-violet-500/30 text-white" 
                        : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
                    )}
                    aria-label={`Open chat: ${c.title}`}
                  >
                    <div className="min-w-0 flex-1 flex gap-2.5 items-center">
                      <MessageSquare className={cn("h-4 w-4 shrink-0", isActive ? "text-violet-400" : "text-slate-500")} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate pr-1">{c.title || "Empty Chat"}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{c.lastActive}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(c.id, e)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      aria-label={`Delete chat: ${c.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Active conversation area */}
        <div className="flex-1 flex flex-col bg-slate-900/10 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md">
          {activeChat ? (
            <>
              {/* Chat Title header */}
              <div className="px-6 py-4 border-b border-slate-900 bg-slate-950/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-violet-600/10 border border-violet-500/15 flex items-center justify-center text-violet-400">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 leading-snug">{activeChat.title}</h2>
                    <p className="text-[10px] text-slate-500 leading-none mt-0.5">AcuraX AI Assistant</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold text-slate-400 border-slate-800 tracking-wider uppercase">
                  Employee Session
                </Badge>
              </div>

              {/* Chat Bubble Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {(activeChat?.messages ?? []).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-900/10 mb-4 animate-pulse">
                      <Bot className="h-7 w-7" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-200">Ask me anything about AcuraX</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Retrieve instant details, guidelines, reimbursement plans, and tech resources from our corporate knowledge directories.
                    </p>

                    {/* Example Query chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mt-6">
                      {[
                        { text: "What's our PTO policy?", key: "pto" },
                        { text: "How do I setup the VPN?", key: "vpn" },
                        { text: "What are core working hours?", key: "hours" },
                        { text: "How do I submit an expense?", key: "expense" }
                      ].map((chip) => (
                        <button
                          key={chip.key}
                          onClick={() => handleSendPrompt(chip.text)}
                          className={cn(
                            "p-3 text-left rounded-xl border border-white/5 bg-white/[0.01] text-[11px] font-medium text-slate-350 transition-all",
                            "hover:border-violet-550/40 hover:bg-violet-600/[0.03] hover:text-slate-100",
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
                          )}
                          aria-label={`Ask: ${chip.text}`}
                        >
                          {chip.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {(activeChat?.messages ?? []).map((msg) => {
                      const isUser = msg.sender === "user";
                      return (
                        <div key={msg.id} className={cn("flex gap-3 max-w-2xl", isUser ? "ml-auto flex-row-reverse" : "")}>
                          <div className={cn(
                            "h-7 w-7 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] border",
                            isUser 
                              ? "bg-slate-800 border-slate-700 text-slate-300" 
                              : "bg-violet-650/15 border-violet-500/20 text-violet-400"
                          )}>
                            {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                          </div>

                          <div className="space-y-1.5 min-w-0">
                            <div className={cn("flex items-center gap-2", isUser && "justify-end")}>
                              <span className="text-[10px] font-bold text-slate-300">
                                {isUser ? "You" : "AI Assistant"}
                              </span>
                              <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                            </div>
                            
                            <div className={cn(
                              "p-4 rounded-xl text-xs border leading-relaxed",
                              isUser 
                                ? "bg-violet-600 text-white border-transparent rounded-tr-none shadow-md shadow-violet-900/10" 
                                : "bg-slate-900/40 border-slate-850 text-slate-300 rounded-tl-none"
                            )}>
                              {isUser ? <p className="whitespace-pre-wrap">{msg.text}</p> : renderFormattedMessage(msg.text)}

                              {/* Document citations */}
                              {!isUser && msg.sources && (
                                <div className="mt-3.5 pt-3 border-t border-slate-800/60">
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-bold mb-2">
                                    <BookOpen className="h-3 w-3 text-violet-400" />
                                    <span>Sources Cited</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {msg.sources.map((source) => (
                                      <button
                                        key={source}
                                        onClick={() => setPreviewDocKey(source)}
                                        className={cn(
                                          "inline-flex items-center gap-1 rounded bg-slate-950 border border-slate-850 px-2 py-1 text-[10px] font-medium text-slate-300 transition-colors",
                                          "hover:border-violet-500/40 hover:text-violet-450"
                                        )}
                                        aria-label={`Preview document: ${source}`}
                                      >
                                        <FileText className="h-3 w-3 text-slate-500" />
                                        <span>{source}</span>
                                        <ExternalLink className="h-2.5 w-2.5 opacity-55" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {thinking && (
                      <div className="flex gap-3 max-w-xl">
                        <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center bg-violet-650/15 border border-violet-500/20 text-violet-400">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-300">AI Assistant</span>
                            <span className="text-[9px] text-slate-500">Searching sources...</span>
                          </div>
                          <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl rounded-tl-none flex items-center gap-3">
                            <div className="flex gap-1 items-center py-1">
                              <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                            <span className="text-xs text-slate-400">Searching policy registry...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-900 bg-slate-950/60 shrink-0">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendPrompt(); }}
                  className="relative flex items-end gap-2 bg-slate-950 border border-slate-850 rounded-xl p-2 focus-within:ring-2 focus-within:ring-violet-550/40 focus-within:border-violet-550/40 transition-all duration-150"
                >
                  <button
                    type="button"
                    className="p-2 text-slate-500 hover:text-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 shrink-0 mb-0.5"
                    aria-label="Attach context file"
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </button>
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about AcuraX policies..."
                    className="flex-1 bg-transparent border-0 text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:ring-0 max-h-[120px] resize-none py-2 px-1 scrollbar-none"
                    style={{ minHeight: "24px" }}
                  />
                  <div className="flex items-center gap-1.5 shrink-0 ml-2 mb-0.5">
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline mr-1">Enter to send</span>
                    <Button 
                      type="submit" 
                      disabled={thinking || !inputText.trim()}
                      size="icon" 
                      className="h-8 w-8 bg-violet-650 hover:bg-violet-600 active:bg-violet-700 text-white rounded-lg disabled:opacity-40 disabled:hover:bg-violet-650"
                      aria-label="Send message"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-550">
              <MessageSquare className="h-10 w-10 text-slate-650 opacity-40 mb-3" />
              <p className="text-xs font-bold text-slate-400">No active conversation</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-normal">
                Select a past query from the sidebar history or click New Chat to start.
              </p>
              <Button onClick={handleNewChat} size="sm" className="h-8 font-bold mt-4">
                Create First Chat
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* Document citation preview Dialog */}
      <Dialog isOpen={!!previewDocKey} onClose={() => setPreviewDocKey(null)} title={previewDocKey ? MOCK_DOCS[previewDocKey]?.title : ""}>
        {previewDocKey && MOCK_DOCS[previewDocKey] && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-850">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">{MOCK_DOCS[previewDocKey].category}</span>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-slate-300 text-xs leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap">
              {MOCK_DOCS[previewDocKey].content}
            </div>

            <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-900 mt-4">
              <span className="text-[10px] text-slate-500 italic">Read-only citation preview</span>
              <Button size="sm" onClick={() => setPreviewDocKey(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}

// ── Default Export ────────────────────────────────────────────────────────────

export default function ChatPlayground() {
  const role = useUserRole();

  if (role === "manager") {
    return <ManagerChatPlayground />;
  }

  return <EmployeeChatPlayground />;
}
