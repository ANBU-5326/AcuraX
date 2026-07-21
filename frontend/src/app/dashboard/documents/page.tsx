"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Files, Plus, Trash2, ArrowDownToLine, RefreshCw,
  Layers, HardDrive, FileSpreadsheet, CheckCircle2,
  ShieldAlert, Lock, Search, FileText, ChevronRight, X, Sparkles
} from "lucide-react";
import { client, DocumentFile } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/dialog";
import RoleGate from "@/components/layout/RoleGate";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type FileFilter = "All" | "PDF" | "Word" | "Spreadsheet" | "Recently Added";

interface EmployeeDoc {
  id: string;
  name: string;
  size: string;
  updatedAt: string;
  type: "pdf" | "docx" | "xlsx";
  content: string;
}

// ── Mock Document content for employee view ──────────────────────────────────

const EMPLOYEE_DOCS: EmployeeDoc[] = [
  {
    id: "doc-1",
    name: "Remote Work & Flexible Hours Policy.pdf",
    size: "184 KB",
    updatedAt: "Jun 18, 2026",
    type: "pdf",
    content: `## Remote Work & Flexible Hours Policy

AcuraX supports flexible working arrangements for eligible employees. This policy outlines expectations and entitlements.

### Core Hours
All employees are expected to be reachable between **10:00 AM – 3:00 PM** in their local timezone. Outside these hours, flexible scheduling applies.

### Equipment Reimbursement
- **Monitor**: Up to $400 reimbursed upon HR approval
- **Keyboard & Mouse**: Up to $100
- **Desk Chair**: Up to $300
- **Home Internet**: $50/month stipend

### Expectations
1. Respond to messages within 2 hours during core hours.
2. Keep your calendar up to date with your working hours.
3. Attend scheduled team standups via video with camera on.
4. Notify your manager at least 24 hours in advance of any schedule changes.

For questions, contact **hr@acurax.ai**.`
  },
  {
    id: "doc-2",
    name: "Getting Started with AcuraX Playground.docx",
    size: "92 KB",
    updatedAt: "Jun 20, 2026",
    type: "docx",
    content: `## Getting Started with AcuraX Playground

The Playground is your main workspace for interacting with AI agents. Here's how to get started.

### Step 1: Choose an Agent
From the sidebar, navigate to Playground Chat. You'll see a list of shared agents on the right panel.

### Step 2: Write Your First Prompt
Click on an agent to activate it. Type your question in the message box at the bottom and press Enter.

### Step 3: Read the Response
The agent's reply appears in the chat. Responses may cite sources from your company's document library. Click on these citations to read the policy documents directly.

Need Help? Contact IT Support or ask in #ai-tools on Slack.`
  },
  {
    id: "doc-3",
    name: "How to Reset Your Password.pdf",
    size: "64 KB",
    updatedAt: "Jun 10, 2026",
    type: "pdf",
    content: `## How to Reset Your Password

If you've forgotten your password or need to reset it for security reasons, follow these steps.

### Self-Service Reset (Recommended)
1. Go to https://auth.acurax.ai/reset
2. Enter your company email address
3. Check your inbox for a reset link (expires in 15 minutes)
4. Click the link and enter your new password
5. Password must be at least 12 characters with one uppercase letter, one number, and one symbol

Passwords expire every 90 days. You'll receive a reminder email 7 days before expiry.`
  },
  {
    id: "doc-4",
    name: "Leave & Time-Off Request Process.pdf",
    size: "245 KB",
    updatedAt: "Jun 05, 2026",
    type: "pdf",
    content: `## Leave & Time-Off Policy

AcuraX offers several leave types to support employee wellbeing.

### Leave Types
- Annual Leave: 20 days per year (carry up to 5 days into next year)
- Sick Leave: 12 days (doctor's note required after 3 days)
- Maternity/Paternity: 90 / 30 days (paid at full salary)
- Compassionate Leave: Up to 5 days

### How to Request Leave
1. Open the HR Portal at hr.acurax.ai
2. Select My Leave -> Request New Leave
3. Choose leave type, start date, end date, and submit
4. Your manager will review and approve.`
  },
  {
    id: "doc-5",
    name: "VPN Setup & Secure Remote Access.docx",
    size: "128 KB",
    updatedAt: "Jun 14, 2026",
    type: "docx",
    content: `## VPN Setup & Secure Remote Access

The AcuraX VPN secures your connection to internal tools and resources when working outside the office.

### Download the VPN Client
Download the client from the IT Portal: https://it.acurax.ai/vpn

### Installation Steps
1. Run the downloaded installer as Administrator
2. Accept the terms of service
3. Enter the server address: vpn.acurax.ai
4. Log in with your AcuraX email and password
5. Approve the MFA push notification on your phone`
  },
  {
    id: "doc-6",
    name: "Employee Expense Reimbursement Guide.xlsx",
    size: "312 KB",
    updatedAt: "May 28, 2026",
    type: "xlsx",
    content: `## Employee Expense Reimbursement Guide

AcuraX reimburses reasonable business-related expenses. Here's how to submit a claim.

### What Can Be Reimbursed?
- Business travel: flights, hotels (economy class, up to $200/night)
- Client meals: up to $75/person
- Software & tools: up to $50/month without pre-approval
- Training & conferences: up to $1,000/year with manager approval

### How to Submit
1. Open the Expense Portal: expenses.acurax.ai
2. Click + New Expense Report
3. Upload receipts, categorise, and submit for approval

Submit within 30 days of the expense. Reimbursed in the next payroll cycle.`
  }
];

// ── Skeleton Loader ──────────────────────────────────────────────────────────

function DocSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-800 rounded w-3/4" />
          <div className="h-3 bg-slate-800 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-slate-800 rounded w-full pt-2" />
    </div>
  );
}

// ── Manager View (Original) ──────────────────────────────────────────────────

function ManagerDocumentsView() {
  const { success, error } = useToast();
  const [docs, setDocs] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [uploadName, setUploadName] = useState("");
  const [uploadSize, setUploadSize] = useState("1.5 MB");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await client.getDocuments();
      setDocs(data);
    } catch {
      error("Registry query failed", "Could not fetch document configurations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocs(); }, []);

  const handleUploadSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName) {
      error("Filename is empty", "Provide a file name to register.");
      return;
    }
    setUploading(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) { clearInterval(interval); return 95; }
        return prev + 25;
      });
    }, 300);
    try {
      const extension = uploadName.includes(".") ? uploadName.split(".").pop() || "txt" : "txt";
      const newDoc = await client.uploadDocument(uploadName, uploadSize, extension);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setDocs((prev) => [...prev, newDoc]);
        success("Document Registered", `${newDoc.name} ingested & mapped into pgvector storage.`);
        setUploadName("");
        setUploading(false);
        setUploadProgress(0);
      }, 300);
    } catch {
      clearInterval(interval);
      setUploading(false);
      setUploadProgress(0);
      error("Ingestion failed", "Could not chunk/embedding document inputs.");
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Remove this document from knowledge base?")) return;
    try {
      await client.deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      success("Document Purged", "Cleaned up matching vector chunk indexes.");
    } catch {
      error("Error Deleting", "Could not remove matching indices.");
    }
  };

  const totalChunks = docs.reduce((sum, d) => sum + (d.chunks || 0), 0);
  const storageCount = docs.length;
  const filteredDocs = docs.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">RAG Document Hub</h1>
          <p className="text-slate-400 text-xs mt-1">Store, chunk, and sync PDFs and directories into vector database indices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-400">Total Vectors Indexes</span>
            <Layers className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-100">{totalChunks} chunks</div>
            <p className="text-[10px] text-slate-500 mt-1">Ingested via OpenAI text-embedding-3</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-400">Registry Count</span>
            <Files className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-100">{storageCount} Files</div>
            <p className="text-[10px] text-slate-500 mt-1">PDFs, MD, and CSV sources</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-400">RAG Storage size</span>
            <HardDrive className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-100">3.6 MB</div>
            <p className="text-[10px] text-slate-500 mt-1">Workspace storage threshold (Limit: 50MB)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0 overflow-hidden" glass>
            <CardHeader className="p-6 border-b border-slate-900 bg-slate-950/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-4.5 w-4.5 text-violet-400" />
                Ingestion Database Table
              </CardTitle>
              <CardDescription>Verify parsing, token sizes, and sync attributes of workspace documents.</CardDescription>
            </CardHeader>

            <div className="p-4 border-b border-slate-900 bg-slate-950/20">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search documents by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-950/60 border-slate-850 h-9 text-xs"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2.5">
                <RefreshCw className="h-7 w-7 text-violet-500 animate-spin" />
                <p className="text-xs text-slate-500">Querying semantic indices...</p>
              </div>
            ) : docs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Files className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                <p className="text-xs">No documents uploaded into database.</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Search className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                <p className="text-xs">No matching documents found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-900 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">File Name</th>
                      <th className="p-4">Size</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Chunks</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 bg-slate-900/10">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 font-bold text-slate-200">{doc.name}</td>
                        <td className="p-4 text-slate-400">{doc.size}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            {doc.status === "ready" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : doc.status === "failed" ? (
                              <ShieldAlert className="h-4 w-4 text-rose-500" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                            )}
                            <span className="capitalize">{doc.status}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-300">{doc.chunks || "—"}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-rose-500/5 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5" glass>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-2 mb-4">
              <Plus className="h-4 w-4 text-violet-400" />
              Ingest Document
            </h3>
            <form onSubmit={handleUploadSimulate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">File Identifier Name</label>
                <Input
                  placeholder="e.g. competitors_review_2026.pdf"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  disabled={uploading}
                  required
                />
              </div>
              <div className="space-y-1.5 font-semibold">
                <label className="text-xs text-slate-400">Simulate File size</label>
                <select
                  value={uploadSize}
                  onChange={(e) => setUploadSize(e.target.value)}
                  disabled={uploading}
                  className="flex h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                >
                  <option value="45 KB">Small Markdown (45 KB)</option>
                  <option value="1.2 MB">Medium Doc (1.2 MB)</option>
                  <option value="4.8 MB">Large PDF file (4.8 MB)</option>
                </select>
              </div>
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>Chunking & computing vector embeds...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                    <div
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full h-10" loading={uploading}>
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Upload & Chunk File
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Employee View (New Cards Grid Layout) ────────────────────────────────────

function EmployeeDocumentsView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FileFilter>("All");
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<EmployeeDoc | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const filteredDocs = EMPLOYEE_DOCS.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (activeFilter === "PDF") {
      matchesFilter = doc.type === "pdf";
    } else if (activeFilter === "Word") {
      matchesFilter = doc.type === "docx";
    } else if (activeFilter === "Spreadsheet") {
      matchesFilter = doc.type === "xlsx";
    } else if (activeFilter === "Recently Added") {
      matchesFilter = doc.updatedAt.includes("Jun");
    }

    return matchesSearch && matchesFilter;
  });

  const getFileIcon = (type: "pdf" | "docx" | "xlsx") => {
    if (type === "pdf") return <FileText className="h-5 w-5 text-rose-500" />;
    if (type === "docx") return <FileText className="h-5 w-5 text-blue-500" />;
    return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
  };

  const handleAskAI = (docName: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("acurax_pending_prompt", `Explain the details and core requirements of "${docName}"`);
      router.push("/dashboard/chat");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
          Documents
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Search and view documents shared with you.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/60",
              "text-sm text-slate-200 placeholder-slate-500",
              "focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50",
              "transition-all duration-150"
            )}
            aria-label="Search documents by name"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter documents by type">
          {(["All", "PDF", "Word", "Spreadsheet", "Recently Added"] as FileFilter[]).map((f) => {
            const isActive = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                aria-pressed={isActive}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950",
                  isActive
                    ? "bg-violet-600 border-violet-500 text-white shadow-sm shadow-violet-900/30"
                    : "bg-transparent border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-250 hover:bg-slate-900/50"
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <DocSkeleton key={i} />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
            <Files className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-300">No documents found</p>
            <p className="text-xs text-slate-500 mt-1">Try a different name or clear current type filters.</p>
          </div>
          <button
            onClick={() => { setSearchQuery(""); setActiveFilter("All"); }}
            className="text-xs text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-2 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className={cn(
                "group text-left w-full rounded-xl border border-white/10 bg-white/[0.02] p-6",
                "transition-all duration-200 cursor-pointer flex flex-col gap-3 justify-between",
                "hover:border-violet-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-950/15",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              )}
              aria-label={`Open document preview for ${doc.name}`}
            >
              <div className="flex items-start gap-3.5 w-full">
                <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl shrink-0 group-hover:scale-105 transition-transform duration-200">
                  {getFileIcon(doc.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-200 leading-snug truncate group-hover:text-violet-300 transition-colors">
                    {doc.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.updatedAt}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-650 mt-1 shrink-0 group-hover:translate-x-0.5 group-hover:text-violet-400 transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Document Content Preview Modal */}
      <Dialog
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc ? selectedDoc.name : ""}
      >
        {selectedDoc && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center bg-slate-900/40 border border-slate-850 p-2.5 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Protected Workspace File
              </span>
              <Button
                size="sm"
                className="h-8 text-[10.5px] font-bold bg-violet-600 hover:bg-violet-500 text-white"
                onClick={() => handleAskAI(selectedDoc.name)}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Ask AI about this document
              </Button>
            </div>

            {/* Document Content Viewport */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 text-slate-350 text-xs leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre-wrap font-sans">
              {selectedDoc.content}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-900 gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-slate-805 text-slate-400 hover:text-slate-200"
                onClick={() => setSelectedDoc(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

// ── Default Export ────────────────────────────────────────────────────────────

export default function DocumentsRegistry() {
  const role = useUserRole();

  if (role === "manager") {
    return <ManagerDocumentsView />;
  }

  return <EmployeeDocumentsView />;
}
