import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
    secondary: "bg-slate-100 text-slate-600 border-slate-200 font-medium",
    destructive: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
    outline: "bg-white text-slate-700 border-slate-200 font-medium",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
