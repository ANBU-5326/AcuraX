"use client";

import { useState } from "react";
import { client, Agent } from "@/lib/api";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const data = await client.getAgents();
      setAgents(data);
    } catch (e) {
      console.error("Failed to fetch agents", e);
    } finally {
      setLoading(false);
    }
  };

  return { agents, loading, fetchAgents };
}
