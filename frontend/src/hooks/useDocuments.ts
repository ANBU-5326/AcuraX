"use client";

import { useState } from "react";
import { client, DocumentFile } from "@/lib/api";

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await client.getDocuments();
      setDocuments(data);
    } catch (e) {
      console.error("Failed to fetch documents", e);
    } finally {
      setLoading(false);
    }
  };

  return { documents, loading, fetchDocuments };
}
