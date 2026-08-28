"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Database, Search, BookOpen, Layers, Plus, ExternalLink,
  ChevronRight, RefreshCw, FileText, Globe, Key, ShieldCheck,
  Sparkles, CheckCircle2, ArrowRight, X, ThumbsUp, ThumbsDown
} from "lucide-react";
import { client, KnowledgeArticle } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog } from "@/components/ui/dialog";

export default function KnowledgeBase() {
  const { success, error } = useToast();
  const role = useUserRole();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

  useEffect(() => {
    client.getKnowledgeBases().then((data) => {
      setArticles(data);
    }).catch(() => error("Error", "Could not fetch knowledge articles.")).finally(() => setLoading(false));
  }, [error]);

  const filtered = articles.filter(a =>
    (a.title || a.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.summary || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2.5">
            <Database className="h-7 w-7 text-indigo-600" />
            Knowledge Base Wiki
          </h1>
          <p className="text-slate-600 text-xs mt-1">
            Browse internal company policies, FAQs, and setup guides.
          </p>
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 w-48 md:w-64 shadow-2xs"
          />
        </div>
      </div>

      {/* Grid of Knowledge Articles */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Querying knowledge indices...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-300 rounded-3xl bg-white">
          <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Articles Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <Card
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="bg-white border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group p-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                    {article.category || "General"}
                  </span>
                  <BookOpen className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {article.title || article.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {article.summary || article.source}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                <span>Read article</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Article Dialog Preview */}
      {selectedArticle && (
        <Dialog open={!!selectedArticle} onClose={() => setSelectedArticle(null)} title={selectedArticle.title || selectedArticle.name}>
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 font-medium">{selectedArticle.summary || selectedArticle.source}</p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono whitespace-pre-wrap max-h-80 overflow-y-auto">
              {selectedArticle.content || selectedArticle.summary || "No extended content available."}
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedArticle(null)} className="bg-indigo-600 text-white font-semibold">
                Close Article
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
