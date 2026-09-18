// src/components/ProtectedRoute.jsx

import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import authService from "../services/authService";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [state, setState] = useState({ status: "checking", message: "" });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!authService.isAuthenticated() || !authService.isAdmin()) {
        if (!cancelled) setState({ status: "unauthenticated", message: "" });
        return;
      }

      const result = await authService.verifyToken();
      if (cancelled) return;

      if (result.ok) {
        setState({ status: "authorized", message: "" });
      } else if (result.reason === "network") {
        // Jangan tendang admin keluar hanya karena internet sedang putus.
        setState({ status: "offline", message: result.message });
      } else {
        setState({ status: "unauthenticated", message: "" });
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  if (state.status === "offline") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-800">
            Tidak bisa menghubungi server
          </h2>
          <p className="text-sm text-slate-600">
            {state.message ||
              "Periksa koneksi internet Anda, lalu coba muat ulang."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "unauthenticated") {
    // Simpan tujuan awal supaya setelah login kembali ke halaman yang dituju.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
