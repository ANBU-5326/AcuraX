"use client";

import { useState } from "react";
import { client } from "@/lib/api";

export function useChat(agentId?: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await client.chatWithAgent(agentId || "", text);
      setMessages((prev) => [...prev, { sender: "user", text }, { sender: "agent", text: res.response }]);
    } catch (e) {
      console.error("Failed to send chat message", e);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage };
}
