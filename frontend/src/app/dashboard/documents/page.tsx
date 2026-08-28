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

type FileFilter = "All" | "PDF" | "Word" | "Spreadsheet" | "Recently Added";

interface EmployeeDoc {
  id: string;
  name: string;
  size: string;
  updatedAt: string;
  type: "pdf" | "docx" | "xlsx";
  content: string;
}

const EMPLOYEE_DOCS: EmployeeDoc[] = [
  {
    id: "doc-1",
    name: "Remote Work & Flexible Hours Policy.pdf",
    size: "184 KB",
    updatedAt: "Jun 18, 2026",
    type: "pdf",
    content: `## Remote Work & Flexible Hours Policy\n\nAcuraX supports flexible working arrangements for eligible employees. This policy outlines expectations and entitlements.\n\n### Core Hours\nAll employees are expected to be reachable between 10:00 AM – 3:00 PM in their local timezone.\n\n### Equipment Reimbursement\n- Monitor: Up to $400 reimbursed\n- Keyboard & Mouse: Up to $100\n- Home Internet: $50/month stipend.`
  },
  {
    id: "doc-2",
    name: "Getting Started with AcuraX Playground.docx",
    size: "92 KB",
    updatedAt: "Jun 20, 2026",
    type: "docx",
    content: `## Getting Started with AcuraX Playground\n\nThe Playground is your main workspace for interacting with AI agents.\n\n### Step 1: Choose an Agent\nNavigate to Playground Chat from the sidebar.\n\n### Step 2: Write Your First Prompt\nType your question in the message box.`
  },
  {
    id: "doc-3",
    name: "How to Reset Your Password.pdf",
    size: "64 KB",
    updatedAt: "Jun 10, 2026",
    type: "pdf",
    content: `## How to Reset Your Password\n\n1. Go to https://auth.acurax.ai/reset\n2. Enter your company email address\n3. Click the reset link sent to your email.`
  }
];

function ManagerDocumentsView() {
  const { success, error } = useToast();
  const [docs, setDocs] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadSize, setUploadSize] = useState("1.2 MB");
  const [uploading, setUploading] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await client.getDocuments();
      setDocs(data);
    } catch {
      error("Data error", "Could not fetch document registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, []);

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document from pgvector storage?")) return;
    try {
      await client.deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      success("Document Removed", "File reference purged from vector store.");
    } catch {
      error("Delete Failed", "Could not remove file.");
    }
  };

  const handleUploadSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName) return;

    setUploading(true);
    try {
      const newDoc = await client.uploadDocument(
        uploadName,
        uploadSize,
        uploadName.endsWith(".pdf") ? "pdf" : "docx"
      );

      setDocs((prev) => [...prev, newDoc]);
      success("Document Uploaded", `${newDoc.name} has been processed into vector index.`);
      setUploadName("");
    } catch {
      error("Upload Failed", "Could not upload document.");
    } finally {
      setUploading(false);
    }
  };

  const totalChunks = docs.reduce((sum, d) => sum + (d.chunks || 0), 0);
  const storageCount = docs.length;
  const filteredDocs = docs.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2.5">
            <Files className="h-7 w-7 text-indigo-600" />
            RAG Document Hub
          </h1>
          <p className="text-slate-600 text-xs mt-1">Store, chunk, and sync PDFs and directories into vector database indices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500">Total Vectors Indexes</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">{totalChunks} chunks</div>
            <p className="text-[10px] text-slate-500 mt-1">Ingested via OpenAI text-embedding-3</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500">Registry Count</span>
            <Files className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">{storageCount} Files</div>
            <p className="text-[10px] text-slate-500 mt-1">PDFs, MD, and CSV sources</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500">RAG Storage size</span>
            <HardDrive className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">3.6 MB</div>
            <p className="text-[10px] text-slate-500 mt-1">Workspace storage threshold (Limit: 50MB)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 bg-slate-50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-600" />
                Ingestion Database Table
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Verify parsing, token sizes, and sync attributes of workspace documents.</CardDescription>
            </CardHeader>

            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search documents by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 h-9 text-xs text-slate-900"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2.5">
                <RefreshCw className="h-7 w-7 text-indigo-600 animate-spin" />
                <p className="text-xs text-slate-500">Querying semantic indices...</p>
              </div>
            ) : docs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Files className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs">No documents uploaded into database.</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Search className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs">No matching documents found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">File Name</th>
                      <th className="p-4">Size</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Chunks</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{doc.name}</td>
                        <td className="p-4 text-slate-500">{doc.size}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            {doc.status === "ready" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                            )}
                            <span className="capitalize text-slate-700 font-semibold">{doc.status}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">{doc.chunks || "—"}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-all"
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
          <Card className="p-5 bg-white border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
              <Plus className="h-4 w-4 text-indigo-600" />
              Ingest Document
            </h3>
            <form onSubmit={handleUploadSimulate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">File Identifier Name</label>
                <Input
                  placeholder="e.g. competitors_review_2026.pdf"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  disabled={uploading}
                  required
                />
              </div>
              <div className="space-y-1.5 font-semibold">
                <label className="text-xs text-slate-700">Simulate File size</label>
                <select
                  value={uploadSize}
                  onChange={(e) => setUploadSize(e.target.value)}
                  disabled={uploading}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  <option value="45 KB">Small Markdown (45 KB)</option>
                  <option value="1.2 MB">Medium Doc (1.2 MB)</option>
                  <option value="4.8 MB">Large PDF file (4.8 MB)</option>
                </select>
              </div>
              <Button type="submit" className="w-full h-10 bg-indigo-600 text-white font-bold" disabled={uploading}>
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                {uploading ? "Ingesting File..." : "Upload & Chunk File"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmployeeDocumentsView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FileFilter>("All");
  const [selectedDoc, setSelectedDoc] = useState<EmployeeDoc | null>(null);

  const filteredDocs = EMPLOYEE_DOCS.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = true;
    if (activeFilter === "PDF") matchesFilter = doc.type === "pdf";
    if (activeFilter === "Word") matchesFilter = doc.type === "docx";
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Files className="h-7 w-7 text-indigo-600" /> Documents Library
        </h1>
        <p className="text-slate-600 text-xs mt-1">Search and view company policy documents shared with your team.</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between shadow-2xs group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{doc.name}</h3>
                <p className="text-[10px] text-slate-500 mt-1">{doc.size} • {doc.updatedAt}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedDoc && (
        <Dialog open={!!selectedDoc} onClose={() => setSelectedDoc(null)} title={selectedDoc.name}>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap max-h-80 overflow-y-auto">
              {selectedDoc.content}
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedDoc(null)} className="bg-indigo-600 text-white font-semibold">
                Close Preview
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default function DocumentsRegistry() {
  const role = useUserRole();
  if (role === "manager") return <ManagerDocumentsView />;
  return <EmployeeDocumentsView />;
}
