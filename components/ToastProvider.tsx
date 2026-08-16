"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{
  showToast: (message: string, type?: ToastType) => void;
}>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const ACCENT_BY_TYPE: Record<ToastType, string> = {
  success: "border-l-[#053400]",
  error: "border-l-red-500",
  info: "border-l-[#9A9188]",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.random();

      setToasts((current) => [...current, { id, message, type }]);

      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4500);
    },
    []
  );

  function dismiss(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`animate-toast-in pointer-events-auto flex min-w-[260px] max-w-sm items-start justify-between gap-3 rounded-lg border border-[#DCD4C9] border-l-4 bg-white px-4 py-3 text-sm text-[#46382F] shadow-lg ${ACCENT_BY_TYPE[toast.type]}`}
          >
            <span className="leading-5">{toast.message}</span>

            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="mt-0.5 shrink-0 text-[#9A9188] transition hover:text-[#46382F]"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
