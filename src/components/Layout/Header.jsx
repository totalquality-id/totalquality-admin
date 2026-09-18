// src/components/Layout/Header.jsx

import React from "react";
import { useLocation } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import authService from "../../services/authService";
import { titleForPath } from "../../routes";

const Header = ({ isOpen, setIsOpen }) => {
  const { pathname } = useLocation();

  // Sebelumnya baris ini melakukan `user.name.charAt(0)` langsung. Kalau
  // localStorage tidak punya "user" (atau isinya tanpa name), seluruh panel
  // gagal render dengan layar putih. Sekarang semuanya punya fallback.
  const user = authService.getCurrentUser() ?? {};
  const userName = user.name?.trim() || "Admin";
  const userEmail = user.email?.trim() || "";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    if (window.confirm("Yakin ingin keluar dari panel admin?")) {
      authService.logout();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label={isOpen ? "Tutup menu" : "Buka menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="flex-1 lg:ml-0 ml-2">
        <h2 className="text-xl font-semibold text-slate-800">
          {titleForPath(pathname)}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-slate-700">{userName}</p>
          {userEmail && <p className="text-xs text-slate-500">{userEmail}</p>}
        </div>

        <div
          className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold"
          aria-hidden="true"
        >
          {userInitial}
        </div>

        {/* Tombol logout sebelumnya hidden di mobile sehingga admin tidak bisa
            keluar dari HP sama sekali. */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
