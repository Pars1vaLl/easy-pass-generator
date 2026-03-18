"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success: "bg-[#0d1f16] border-[#10b981]/40 text-[#34d399]",
  error: "bg-[#1f0d0d] border-[#ef4444]/40 text-[#f87171]",
  warning: "bg-[#1f1a0d] border-[#f59e0b]/40 text-[#fbbf24]",
  info: "bg-[#0d1320] border-[#7c5af5]/40 text-[#a78bfa]",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 3500) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-4), { id, type, message, duration }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const success = useCallback((m: string) => toast(m, "success"), [toast]);
  const error = useCallback((m: string) => toast(m, "error"), [toast]);
  const warning = useCallback((m: string) => toast(m, "warning"), [toast]);
  const info = useCallback((m: string) => toast(m, "info"), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}

      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-[min(380px,calc(100vw-2rem))]"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl",
                  STYLES[t.type]
                )}
              >
                <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
