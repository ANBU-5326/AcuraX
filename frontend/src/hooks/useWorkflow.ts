"use client";

import { useState } from "react";
import { client, Workflow } from "@/lib/api";

export function useWorkflow() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const data = await client.getWorkflows();
      setWorkflows(data);
    } catch (e) {
      console.error("Failed to fetch workflows", e);
    } finally {
      setLoading(false);
    }
  };

  return { workflows, loading, fetchWorkflows };
}
