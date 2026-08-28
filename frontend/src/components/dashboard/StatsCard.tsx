"use client";

import React from "react";

export function StatsCard({ title, value }: { title?: string; value?: string | number }) {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="text-sm font-medium text-muted-foreground">{title || "Stat"}</div>
      <div className="text-2xl font-bold">{value || "0"}</div>
    </div>
  );
}
