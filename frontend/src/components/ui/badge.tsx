import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

export function Badge({ className, variant = "primary", ...props }: BadgeProps) {
  const variants = {
    primary: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
    secondary: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    destructive: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    outline: "bg-transparent text-slate-400 border border-slate-700"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
