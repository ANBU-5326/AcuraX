/**
 * AcuraX API Client
 * Connects to the FastAPI backend at http://localhost:8000
 * Falls back to localStorage mock data if backend is unreachable.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ── Type Definitions ──────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  role: string;
  tier: string;
  members: number;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  tools: string[];
  status: "active" | "inactive" | "idle" | "running" | "failed" | "disabled";
  tokensUsed: number;
  avatarColor: string;
  created_at: string;
  shared: boolean;
}

export interface WorkflowNode {
  id: string;
  type: "trigger" | "llm" | "search" | "code" | "action";
  name: string;
  config: Record<string, any>;
  x: number;
  y: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "published" | "draft";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  updated_at: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  size: string;
  type: string;
  status: "ready" | "processing" | "failed";
  chunks: number;
  created_at: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  type: "file" | "web" | "database";
  source: string;
  status: "synced" | "syncing" | "failed";
  lastSync: string;
  docCount: number;
  title?: string;
  summary?: string;
  category?: string;
  content?: string;
}

export type KnowledgeArticle = KnowledgeBase;

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
  source: string;
  chunksCount: number;
}

// ── Token management helpers ───────────────────────────────────────────────────

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("acurax_access_token");
};

const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("acurax_refresh_token");
};

const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("acurax_access_token", accessToken);
    localStorage.setItem("acurax_refresh_token", refreshToken);
  }
};

const clearTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("acurax_access_token");
    localStorage.removeItem("acurax_refresh_token");
  }
};

// ── Core fetch helper with JWT & auto-refresh ────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retryOnUnauth = true
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Don't set Content-Type if sending FormData (browser will set it w/ boundary)
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retryOnUnauth) {
    // Try to refresh token
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setTokens(data.access_token, data.refresh_token);
          return apiFetch<T>(path, options, false);
        }
      } catch {
        // Refresh failed, clear tokens
        clearTokens();
      }
    }
    clearTokens();
    throw new Error("Unauthorized");
  }

  const text = await response.text();

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    if (text) {
      try {
        const errorBody = JSON.parse(text);
        errorDetail = errorBody.detail || errorDetail;
      } catch {}
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204 || !text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// ── Initial Mock Data (localStorage fallback if backend is unreachable) ───────

const INITIAL_WORKSPACES: Workspace[] = [
  { id: "ws-1", name: "AcuraX Research Dev", role: "Owner", tier: "Pro", members: 4, created_at: "2026-06-01" },
  { id: "ws-2", name: "Client QA Sandbox", role: "Admin", tier: "Enterprise", members: 12, created_at: "2026-06-10" }
];

const INITIAL_AGENTS: Agent[] = [
  {
    id: "agent-1",
    name: "Acura Core Coordinator",
    description: "Multi-modal supervisor agent that routes sub-tasks to specialized models.",
    model: "Claude 3.5 Sonnet",
    temperature: 0.2,
    systemPrompt: "You are the supervisor agent. You break down instructions into sub-tasks and delegate them.",
    tools: ["web_search", "workspace_reader"],
    status: "active",
    tokensUsed: 450200,
    avatarColor: "from-indigo-600 to-violet-600",
    created_at: "2026-06-02",
    shared: true
  },
  {
    id: "agent-2",
    name: "Python Code Optimizer",
    description: "Compiles, reviews, and runs secure sandbox scripts to generate charts and reports.",
    model: "GPT-4o",
    temperature: 0.0,
    systemPrompt: "You are an expert software developer. Write clean, modular, well-commented code.",
    tools: ["python_sandbox", "filesystem_writer"],
    status: "active",
    tokensUsed: 231100,
    avatarColor: "from-emerald-500 to-teal-600",
    created_at: "2026-06-05",
    shared: false
  },
];

const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: "flow-1",
    name: "Stock Sentiment Auto-Alert",
    description: "Triggers on market close, checks company news, runs sentiment analysis, logs anomalies.",
    status: "published",
    nodes: [
      { id: "n-1", type: "trigger", name: "Schedule Trigger (5 PM)", config: { cron: "0 17 * * 1-5" }, x: 100, y: 150 },
      { id: "n-2", type: "search", name: "Google Finance Search", config: { queries: ["AAPL"] }, x: 300, y: 150 },
      { id: "n-3", type: "llm", name: "Claude 3.5 Sentiment", config: { prompt: "Analyze news sentiment: {{input}}" }, x: 500, y: 150 },
      { id: "n-4", type: "action", name: "Post to Slack Alerts", config: { channel: "#market-feed" }, x: 700, y: 150 }
    ],
    edges: [
      { id: "e-1", source: "n-1", target: "n-2" },
      { id: "e-2", source: "n-2", target: "n-3" },
      { id: "e-3", source: "n-3", target: "n-4" }
    ],
    updated_at: "2026-06-23"
  }
];

const INITIAL_DOCUMENTS: DocumentFile[] = [
  { id: "doc-1", name: "AcuraX_Q3_StrategicPlan.pdf", size: "2.4 MB", type: "pdf", status: "ready", chunks: 42, created_at: "2026-06-15" },
  { id: "doc-2", name: "customer_success_guidelines.md", size: "45 KB", type: "md", status: "ready", chunks: 8, created_at: "2026-06-16" },
];

const INITIAL_KNOWLEDGE_BASES: KnowledgeBase[] = [
  { id: "kb-1", name: "AcuraX Strategy Hub", title: "AcuraX Strategy Hub Guide", summary: "Overview of enterprise architecture and multi-agent coordination.", category: "Architecture", content: "Detailed overview of AcuraX framework...", type: "file", source: "3 Documents", status: "synced", lastSync: "2026-06-23 18:45", docCount: 3 },
  { id: "kb-2", name: "Developer Wiki Scraper", title: "Developer Wiki Scraper Docs", summary: "Automated crawling and indexing guidelines for technical wikis.", category: "Developer", content: "Instructions on configuring web crawlers...", type: "web", source: "https://docs.acurax.ai/dev", status: "synced", lastSync: "2026-06-24 09:12", docCount: 84 },
];

// ── localStorage helpers (mock fallback) ─────────────────────────────────────

const getStore = <T>(key: string, initial: T): T => {
  if (typeof window === "undefined") return initial;
  const val = localStorage.getItem(`acurax_${key}`);
  if (!val) {
    localStorage.setItem(`acurax_${key}`, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(val);
  } catch {
    return initial;
  }
};

const setStore = <T>(key: string, data: T): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(`acurax_${key}`, JSON.stringify(data));
  }
};

// ── Helper: map backend agent response to frontend Agent type ─────────────────

function mapBackendAgent(a: any): Agent {
  return {
    id: a.id,
    name: a.name,
    description: a.description || "",
    model: a.model || "Claude 3.5 Sonnet",
    temperature: a.temperature ?? 0.2,
    systemPrompt: a.system_prompt || "",
    tools: a.tools || [],
    status: a.status === "idle" || a.status === "active" ? "active" : (a.status as any),
    tokensUsed: a.tokens_used || 0,
    avatarColor: a.avatar_color || "from-indigo-600 to-violet-600",
    created_at: a.created_at,
    shared: a.is_shared_with_team ?? true,
  };
}

function mapBackendWorkflow(w: any): Workflow {
  return {
    id: w.id,
    name: w.name,
    description: w.description || "",
    status: w.status,
    nodes: w.nodes || [],
    edges: w.edges || [],
    updated_at: w.updated_at || w.created_at,
  };
}

function mapBackendDocument(d: any): DocumentFile {
  const sizeBytes = d.file_size_bytes || 0;
  const sizeStr = sizeBytes > 1_048_576
    ? `${(sizeBytes / 1_048_576).toFixed(1)} MB`
    : sizeBytes > 1024
    ? `${(sizeBytes / 1024).toFixed(0)} KB`
    : `${sizeBytes} B`;
  return {
    id: d.id,
    name: d.file_name,
    size: sizeStr,
    type: d.file_type,
    status: d.status,
    chunks: 0,
    created_at: d.created_at,
  };
}

// ── API Client ─────────────────────────────────────────────────────────────────

export const client = {
  delay: (ms = 300) => new Promise((res) => setTimeout(res, ms)),

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
    const data = await apiFetch<{ access_token: string; refresh_token: string; token_type: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
    setTokens(data.access_token, data.refresh_token);
    return data;
  },

  async register(email: string, password: string, fullName: string, teamName: string): Promise<{ access_token: string; refresh_token: string }> {
    const data = await apiFetch<{ access_token: string; refresh_token: string; token_type: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify({ email, password, full_name: fullName, team_name: teamName }) }
    );
    setTokens(data.access_token, data.refresh_token);
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiFetch("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {}
    }
    clearTokens();
  },

  async getMe(): Promise<any> {
    return apiFetch("/auth/me");
  },

  isLoggedIn(): boolean {
    return !!getToken();
  },

  setTokens,
  clearTokens,

  // ── Workspaces ────────────────────────────────────────────────────────────

  async getWorkspaces(): Promise<Workspace[]> {
    try {
      const data = await apiFetch<any[]>("/workspaces");
      return data;
    } catch {
      return getStore("workspaces", INITIAL_WORKSPACES);
    }
  },

  async createWorkspace(name: string): Promise<Workspace> {
    try {
      return await apiFetch<Workspace>("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    } catch {
      await this.delay(400);
      const workspaces = getStore("workspaces", INITIAL_WORKSPACES);
      const newWS: Workspace = {
        id: `ws-${Date.now()}`,
        name,
        role: "Owner",
        tier: "Pro",
        members: 1,
        created_at: new Date().toISOString().split("T")[0]
      };
      workspaces.push(newWS);
      setStore("workspaces", workspaces);
      return newWS;
    }
  },

  // ── Agents ────────────────────────────────────────────────────────────────

  async getAgents(): Promise<Agent[]> {
    try {
      const data = await apiFetch<any[]>("/agents");
      return data.map(mapBackendAgent);
    } catch {
      return getStore("agents", INITIAL_AGENTS);
    }
  },

  async createAgent(agent: Omit<Agent, "id" | "tokensUsed" | "created_at" | "status" | "avatarColor">): Promise<Agent> {
    try {
      const payload = {
        name: agent.name,
        description: agent.description,
        trigger_type: "manual",
        is_shared_with_team: agent.shared,
        model: agent.model,
        temperature: agent.temperature,
        system_prompt: agent.systemPrompt,
        tools: agent.tools,
      };
      const data = await apiFetch<any>("/agents", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return mapBackendAgent(data);
    } catch {
      await this.delay(500);
      const agents = getStore("agents", INITIAL_AGENTS);
      const colors = ["from-indigo-600 to-violet-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-500"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newAgent: Agent = {
        ...agent,
        id: `agent-${Date.now()}`,
        status: "active",
        tokensUsed: 0,
        avatarColor: randomColor,
        created_at: new Date().toISOString().split("T")[0],
        shared: agent.shared ?? false
      };
      agents.push(newAgent);
      setStore("agents", agents);
      return newAgent;
    }
  },

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.shared !== undefined) payload.is_shared_with_team = updates.shared;
      if (updates.model !== undefined) payload.model = updates.model;
      if (updates.temperature !== undefined) payload.temperature = updates.temperature;
      if (updates.systemPrompt !== undefined) payload.system_prompt = updates.systemPrompt;
      if (updates.tools !== undefined) payload.tools = updates.tools;
      if (updates.tokensUsed !== undefined) payload.tokens_used = updates.tokensUsed;
      if (updates.avatarColor !== undefined) payload.avatar_color = updates.avatarColor;
      const data = await apiFetch<any>(`/agents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return mapBackendAgent(data);
    } catch {
      await this.delay(300);
      const agents = getStore("agents", INITIAL_AGENTS);
      const index = agents.findIndex((a) => a.id === id);
      if (index === -1) throw new Error("Agent not found");
      agents[index] = { ...agents[index], ...updates };
      setStore("agents", agents);
      return agents[index];
    }
  },

  async deleteAgent(id: string): Promise<boolean> {
    try {
      await apiFetch(`/agents/${id}`, { method: "DELETE" });
      return true;
    } catch {
      await this.delay(300);
      let agents = getStore("agents", INITIAL_AGENTS);
      agents = agents.filter((a) => a.id !== id);
      setStore("agents", agents);
      return true;
    }
  },

  // ── Workflows ─────────────────────────────────────────────────────────────

  async getWorkflows(): Promise<Workflow[]> {
    try {
      const data = await apiFetch<any[]>("/workflows");
      return data.map(mapBackendWorkflow);
    } catch {
      return getStore("workflows", INITIAL_WORKFLOWS);
    }
  },

  async saveWorkflow(workflow: Workflow): Promise<Workflow> {
    try {
      const payload = {
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        nodes: workflow.nodes,
        edges: workflow.edges,
      };
      // Try PUT (upsert) first
      const data = await apiFetch<any>(`/workflows/${workflow.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      return mapBackendWorkflow(data);
    } catch {
      await this.delay(500);
      const workflows = getStore("workflows", INITIAL_WORKFLOWS);
      const idx = workflows.findIndex((w) => w.id === workflow.id);
      const updated = { ...workflow, updated_at: new Date().toISOString().split("T")[0] };
      if (idx === -1) {
        workflows.push(updated);
      } else {
        workflows[idx] = updated;
      }
      setStore("workflows", workflows);
      return updated;
    }
  },

  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      await apiFetch(`/workflows/${id}`, { method: "DELETE" });
      return true;
    } catch {
      await this.delay(300);
      let workflows = getStore("workflows", INITIAL_WORKFLOWS);
      workflows = workflows.filter((w) => w.id !== id);
      setStore("workflows", workflows);
      return true;
    }
  },

  // ── Documents ─────────────────────────────────────────────────────────────

  async getDocuments(): Promise<DocumentFile[]> {
    try {
      const data = await apiFetch<any[]>("/documents");
      return data.map(mapBackendDocument);
    } catch {
      return getStore("documents", INITIAL_DOCUMENTS);
    }
  },

  async uploadDocument(name: string, size: string, type: string): Promise<DocumentFile> {
    // Create a minimal blob file for the upload endpoint
    const content = new Blob([`[DEMO] ${name}`], { type: "text/plain" });
    const file = new File([content], name, { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("visibility", "team");
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/documents`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      return mapBackendDocument(data);
    } catch {
      await this.delay(1000);
      const docs = getStore("documents", INITIAL_DOCUMENTS);
      const newDoc: DocumentFile = {
        id: `doc-${Date.now()}`,
        name,
        size,
        type,
        status: "ready",
        chunks: Math.floor(Math.random() * 30) + 5,
        created_at: new Date().toISOString().split("T")[0]
      };
      docs.push(newDoc);
      setStore("documents", docs);
      return newDoc;
    }
  },

  async deleteDocument(id: string): Promise<boolean> {
    try {
      await apiFetch(`/documents/${id}`, { method: "DELETE" });
      return true;
    } catch {
      await this.delay(300);
      let docs = getStore("documents", INITIAL_DOCUMENTS);
      docs = docs.filter((d) => d.id !== id);
      setStore("documents", docs);
      return true;
    }
  },

  // ── Knowledge Bases ───────────────────────────────────────────────────────

  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    try {
      return await apiFetch<KnowledgeBase[]>("/knowledge-bases");
    } catch {
      return getStore("knowledge_bases", INITIAL_KNOWLEDGE_BASES);
    }
  },

  async createKnowledgeBase(name: string, type: "file" | "web" | "database", source: string): Promise<KnowledgeBase> {
    try {
      return await apiFetch<KnowledgeBase>("/knowledge-bases", {
        method: "POST",
        body: JSON.stringify({ name, type, source }),
      });
    } catch {
      await this.delay(400);
      const kbs = getStore("knowledge_bases", INITIAL_KNOWLEDGE_BASES);
      const newKB: KnowledgeBase = {
        id: `kb-${Date.now()}`,
        name,
        type,
        source,
        status: "synced",
        lastSync: new Date().toISOString().slice(0, 16).replace("T", " "),
        docCount: type === "web" ? 1 : 0
      };
      kbs.push(newKB);
      setStore("knowledge_bases", kbs);
      return newKB;
    }
  },

  async syncKB(id: string): Promise<KnowledgeBase> {
    try {
      return await apiFetch<KnowledgeBase>(`/knowledge-bases/${id}/sync`, { method: "POST" });
    } catch {
      const kbs = getStore("knowledge_bases", INITIAL_KNOWLEDGE_BASES);
      const idx = kbs.findIndex((k) => k.id === id);
      if (idx !== -1) {
        kbs[idx].status = "syncing";
        setStore("knowledge_bases", kbs);
        await this.delay(2000);
        kbs[idx].status = "synced";
        kbs[idx].lastSync = new Date().toISOString().slice(0, 16).replace("T", " ");
        kbs[idx].docCount += Math.floor(Math.random() * 5) + 1;
        setStore("knowledge_bases", kbs);
        return kbs[idx];
      }
      throw new Error("KB not found");
    }
  },

  // ── Search ────────────────────────────────────────────────────────────────

  async performSearch(query: string, scoreThreshold: number): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams({ query, scoreThreshold: String(scoreThreshold) });
      const results = await apiFetch<SearchResult[]>(`/search?${params}`);
      return results;
    } catch {
      // Mock fallback
      await this.delay(600);
      const database = [
        { title: "AcuraX Platform Architecture", snippet: "The core layout of AcuraX relies on a multi-agent routing loop using FastAPI and Next.js.", source: "AcuraX_Q3_StrategicPlan.pdf", score: 0.94 },
        { title: "Agentic Loop Design Guidelines", snippet: "When designing agent loops, use supervisors for high abstraction tasks and specific tool execution nodes.", source: "customer_success_guidelines.md", score: 0.88 },
      ];
      return database
        .filter((item) => item.score >= scoreThreshold && (item.title.toLowerCase().includes(query.toLowerCase()) || item.snippet.toLowerCase().includes(query.toLowerCase())))
        .map((item, idx) => ({ id: `sr-${idx}`, ...item, chunksCount: Math.floor(Math.random() * 3) + 1 }));
    }
  },

  // ── Settings ──────────────────────────────────────────────────────────────

  async getSettings(): Promise<Record<string, string>> {
    try {
      return await apiFetch<Record<string, string>>("/settings");
    } catch {
      await this.delay(200);
      return getStore("settings", {
        openai_key: "sk-proj-••••••••••••••••",
        anthropic_key: "sk-ant-••••••••••••••••",
        theme: "dark",
        default_model: "Claude 3.5 Sonnet",
        auto_save: "true"
      });
    }
  },

  async saveSettings(settings: Record<string, string>): Promise<boolean> {
    try {
      await apiFetch("/settings", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      return true;
    } catch {
      await this.delay(300);
      setStore("settings", settings);
      return true;
    }
  },

  // ── Chats ─────────────────────────────────────────────────────────────────

  async getChats(): Promise<any[]> {
    try {
      return await apiFetch<any[]>("/chats");
    } catch {
      return [];
    }
  },

  async createChat(title?: string): Promise<any> {
    try {
      return await apiFetch<any>("/chats", {
        method: "POST",
        body: JSON.stringify({ title: title || "New Conversation" }),
      });
    } catch {
      return { id: `local-${Date.now()}`, title: title || "New Conversation", created_at: new Date().toISOString() };
    }
  },

  async getChatMessages(chatId: string): Promise<any[]> {
    try {
      return await apiFetch<any[]>(`/chats/${chatId}/messages`);
    } catch {
      return [];
    }
  },

  async sendChatMessage(chatId: string, content: string): Promise<any> {
    try {
      return await apiFetch<any>(`/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    } catch {
      return {
        id: `msg-${Date.now()}`,
        chat_id: chatId,
        role: "assistant",
        content: "This is a placeholder response. AI integration coming soon.",
        created_at: new Date().toISOString(),
      };
    }
  },

  async deleteChat(chatId: string): Promise<boolean> {
    try {
      await apiFetch(`/chats/${chatId}`, { method: "DELETE" });
      return true;
    } catch {
      return false;
    }
  },

  // ── Backward Compatible Aliases ───────────────────────────────────────────

  listAgents(): Promise<Agent[]> {
    return this.getAgents();
  },

  listWorkflows(): Promise<Workflow[]> {
    return this.getWorkflows();
  },

  listDocuments(): Promise<DocumentFile[]> {
    return this.getDocuments();
  },

  getKnowledgeArticles(): Promise<KnowledgeBase[]> {
    return this.getKnowledgeBases();
  },

  createDocument(doc: { name: string; size: string; type: string; chunks?: number; status?: "ready" | "processing" | "failed" }): Promise<DocumentFile> {
    return this.uploadDocument(doc.name, doc.size, doc.type);
  },

  search(query: string, scoreThreshold = 0.5): Promise<SearchResult[]> {
    return this.performSearch(query, scoreThreshold);
  },

  async chatWithAgent(agentId: string, text: string): Promise<{ response: string }> {
    await this.delay(400);
    return { response: `Agent ${agentId || "core"} processed query: ${text}` };
  },
};

