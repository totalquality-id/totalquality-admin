// src/pages/NotFound.jsx

import React from "react";
import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

const NotFound = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <FileQuestion className="w-16 h-16 text-slate-300 mb-4" />
    <h2 className="text-2xl font-semibold text-slate-800">
      Halaman tidak ditemukan
    </h2>
    <p className="text-slate-600 mt-2 max-w-md">
      Menu yang Anda tuju tidak ada atau sudah dipindahkan.
    </p>
    <Link
      to="/"
      className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      Kembali ke Dashboard
    </Link>
  </div>
);

export default NotFound;
