"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";
// ...rest of file unchanged

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  toast: (props: Omit<ToastMessage, "id">) => void;
  success: (title: string, desc?: string) => void;
  error: (title: string, desc?: string) => void;
  warning: (title: string, desc?: string) => void;
  info: (title: string, desc?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((props: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...props, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = props.duration || 4000;
    setTimeout(() => {
      dismiss(id);
    }, duration);
  }, [dismiss]);

  const success = useCallback((title: string, desc?: string) => {
    toast({ type: "success", title, description: desc });
  }, [toast]);

  const error = useCallback((title: string, desc?: string) => {
    toast({ type: "error", title, description: desc });
  }, [toast]);

  const warning = useCallback((title: string, desc?: string) => {
    toast({ type: "warning", title, description: desc });
  }, [toast]);

  const info = useCallback((title: string, desc?: string) => {
    toast({ type: "info", title, description: desc });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      {/* Toast Render Area */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
            error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
            warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
            info: <Info className="h-5 w-5 text-blue-500 shrink-0" />
          };

          const borderColors = {
            success: "border-emerald-500/20 bg-slate-900/90",
            error: "border-rose-500/20 bg-slate-900/90",
            warning: "border-amber-500/20 bg-slate-900/90",
            info: "border-blue-500/20 bg-slate-900/90"
          };

          return (
            <div
              key={t.id}
              className={`flex gap-3 p-4 rounded-xl border glassmorphism shadow-2xl transition-all duration-300 animate-slide-in ${borderColors[t.type]}`}
            >
              {icons[t.type]}
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-100">{t.title}</h4>
                {t.description && (
                  <p className="text-xs text-slate-400 mt-1">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
