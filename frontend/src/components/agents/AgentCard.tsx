"use client";

import React from "react";

export function AgentCard({ name, role }: { name?: string; role?: string }) {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="font-semibold">{name || "Agent"}</h3>
      <p className="text-sm text-muted-foreground">{role || "AI Assistant"}</p>
    </div>
  );
}
