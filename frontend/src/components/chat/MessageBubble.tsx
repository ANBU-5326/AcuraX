"use client";

import React from "react";

export function MessageBubble({ message }: { message?: string }) {
  return <div className="p-3 rounded-lg bg-muted text-sm my-1">{message || "Hello"}</div>;
}
