"use client";

import React, { useState } from "react";
import { 
  Search, Sliders, RefreshCw, Layers, ShieldCheck, 
  HelpCircle, ArrowUpRight, Highlighter
} from "lucide-react";
import { client, SearchResult } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function SemanticSearch() {
  const { success, error } = useToast();
  const [query, setQuery] = useState("AcuraX system parameters");
  const [threshold, setThreshold] = useState(0.7);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      error("Query empty", "Please type search query keywords.");
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const data = await client.performSearch(query, threshold);
      setResults(data);
      success("Search Success", `Retrieved ${data.length} semantic vectors above threshold.`);
    } catch {
      error("Search Failed", "Could not query pgvector index.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2.5">
            <Search className="h-7 w-7 text-indigo-600" />
            Semantic Index Inspector
          </h1>
          <p className="text-slate-600 text-xs mt-1">
            Audit vector database embeddings and run similarity queries across synced datasets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Search controls form */}
        <div className="lg:col-span-1">
          <Card className="p-5 bg-white border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
              <Sliders className="h-4 w-4 text-indigo-600" />
              Index Settings
            </h3>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Search Keywords</label>
                <Input
                  placeholder="e.g. FastAPI supervisor"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={searching}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Similarity Threshold</span>
                  <span className="text-indigo-600 font-bold">{Math.round(threshold * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  disabled={searching}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>Flexible (40%)</span>
                  <span>Strict (100%)</span>
                </div>
              </div>

              <Button type="submit" className="w-full h-10 mt-2 bg-indigo-600 text-white font-bold" disabled={searching}>
                <Search className="h-4 w-4 mr-2" />
                {searching ? "Searching..." : "Query Index"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Results grid */}
        <div className="lg:col-span-3 space-y-4">
          {searching ? (
            <div className="h-[250px] flex flex-col items-center justify-center gap-2.5">
              <RefreshCw className="h-7 w-7 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-500">Querying pgvector chunk stores...</p>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[250px] border-dashed border-slate-300 bg-white">
              <HelpCircle className="h-10 w-10 text-slate-400 mb-2" />
              <p className="text-slate-800 font-bold">No results found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">No vector embeddings had a similarity score higher than the {Math.round(threshold * 100)}% threshold. Try lowering the threshold bar.</p>
            </Card>
          ) : !hasSearched ? (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[250px] border-dashed border-slate-300 bg-white">
              <Search className="h-10 w-10 text-slate-400 mb-2" />
              <p className="text-slate-800 font-bold">Semantic Inspector</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">Enter keyword phrases to look up matching vector embedding files from database index.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-semibold">Found {results.length} vector chunks matching query &quot;{query}&quot;</p>
              
              <div className="space-y-4">
                {results.map((res) => {
                  const scorePercentage = Math.round(res.score * 100);
                  
                  return (
                    <Card key={res.id} className="relative overflow-hidden bg-white border-slate-200 hover:border-indigo-300 shadow-2xs">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                          <Highlighter className="h-4.5 w-4.5 text-indigo-600" />
                          <CardTitle className="text-sm font-bold text-slate-900">{res.title}</CardTitle>
                        </div>
                        <Badge 
                          className={`text-[10px] ${
                            res.score >= 0.9 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-sky-50 text-sky-700 border-sky-200"
                          }`}
                        >
                          {scorePercentage}% match
                        </Badge>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                          {res.snippet}
                        </p>
                        
                        <div className="flex justify-between items-center text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-slate-400" />
                            Chunk {res.chunksCount} parsed
                          </span>
                          <span className="flex items-center gap-1 text-indigo-600 font-semibold cursor-pointer hover:underline">
                            Source: {res.source}
                            <ArrowUpRight className="h-3 w-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
