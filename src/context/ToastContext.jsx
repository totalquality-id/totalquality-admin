// src/context/ToastContext.jsx
//
// Pengganti window.alert() yang dipakai di seluruh panel. alert() memblokir
// thread UI, tidak bisa di-style, dan pada aksi beruntun memunculkan dialog
// bertumpuk yang harus diklik satu per satu.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { registerNotifier } from "../lib/notify";
import { ToastContext } from "./toast-context";

const VARIANTS = {
  success: {
    Icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    iconClass: "text-emerald-600",
  },
  error: {
    Icon: AlertCircle,
    className: "border-red-200 bg-red-50 text-red-800",
    iconClass: "text-red-600",
  },
  info: {
    Icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-800",
    iconClass: "text-blue-600",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (variant, message, duration = 4000) => {
      if (!message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, variant, message: String(message) }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      );
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (message, duration) => push("success", message, duration),
      error: (message, duration) => push("error", message, duration ?? 6000),
      info: (message, duration) => push("info", message, duration),
      dismiss,
    }),
    [push, dismiss]
  );

  // Daftarkan ke jembatan notify() supaya modul non-React (services, helper)
  // dan komponen yang belum dimigrasi ke hook tetap bisa menampilkan toast.
  useEffect(() => registerNotifier(value), [value]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const { Icon, className, iconClass } =
            VARIANTS[toast.variant] ?? VARIANTS.info;
          return (
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${className}`}
            >
              <Icon size={18} className={`mt-0.5 flex-shrink-0 ${iconClass}`} />
              <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="flex-shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

