"use client";

import { useState } from "react";
import { client, SearchResult } from "@/lib/api";

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (query: string) => {
    setLoading(true);
    try {
      const data = await client.performSearch(query, 0.5);
      setResults(data);
    } catch (e) {
      console.error("Failed to perform search", e);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, search };
}
