"use client";

import React from "react";

export function ChatWindow({ children }: { children?: React.ReactNode }) {
  return <div className="flex flex-col h-full border rounded-lg p-4">{children}</div>;
}
