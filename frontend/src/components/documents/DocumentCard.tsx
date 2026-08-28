"use client";

import React from "react";

export function DocumentCard({ filename }: { filename?: string }) {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="font-medium">{filename || "Document"}</div>
    </div>
  );
}
