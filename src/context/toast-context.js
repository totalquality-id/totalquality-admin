// src/context/toastContext.js
//
// Context object + hook dipisah dari ToastContext.jsx supaya file komponen
// hanya mengekspor komponen (syarat react-refresh / Fast Refresh di Vite).

import { createContext, useContext } from "react";

export const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  }
  return context;
}
