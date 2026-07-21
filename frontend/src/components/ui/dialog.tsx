import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Container */}
      <div className={cn(
        "relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 z-10 transform scale-100 transition-all duration-300 max-h-[90vh] overflow-y-auto flex flex-col",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
          <h2 className="text-lg font-bold text-slate-100">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-slate-800 rounded-md">
            <X className="h-4 w-4 text-slate-400 hover:text-white" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 text-slate-300 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
