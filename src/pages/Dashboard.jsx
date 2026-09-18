// src/pages/Dashboard.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Briefcase,
  ClipboardList,
  Calendar,
  Newspaper,
  MessageSquare,
  HeadphonesIcon,
  BarChart,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import statsService from "../services/statsService";

const CARDS = [
  {
    key: "users",
    label: "Total Users",
    icon: Users,
    color: "bg-blue-500",
    to: null,
  },
  {
    key: "careers",
    label: "Lowongan",
    icon: Briefcase,
    color: "bg-green-500",
    to: "/careers",
  },
  {
    key: "applications",
    label: "Lamaran Masuk",
    icon: ClipboardList,
    color: "bg-purple-500",
    to: "/applications",
    subKey: "pendingApplications",
    subLabel: "belum ditinjau",
  },
  {
    key: "events",
    label: "Events",
    icon: Calendar,
    color: "bg-orange-500",
    to: "/events",
    subKey: "upcomingEvents",
    subLabel: "akan datang",
  },
  {
    key: "articles",
    label: "Articles",
    icon: Newspaper,
    color: "bg-sky-500",
    to: "/articles",
  },
  {
    key: "services",
    label: "Services",
    icon: Briefcase,
    color: "bg-teal-500",
    to: "/services",
  },
  {
    key: "consultations",
    label: "Permintaan Konsultasi",
    icon: HeadphonesIcon,
    color: "bg-rose-500",
    to: "/consultations",
  },
  {
    key: "forums",
    label: "Forum Quotes",
    icon: MessageSquare,
    color: "bg-indigo-500",
    to: "/forum",
  },
  {
    key: "assessments",
    label: "Hasil Assessment",
    icon: BarChart,
    color: "bg-amber-500",
    to: "/assessments",
  },
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setStats(await statsService.getDashboard());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-600 mt-1">
            Ringkasan isi website Total Quality.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={16} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Gagal memuat statistik</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {CARDS.map(({ key, label, icon: Icon, color, to, subKey, subLabel }) => {
            const card = (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow h-full">
                <div
                  className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4`}
                >
                  <Icon className="text-white" size={24} />
                </div>
                <p className="text-slate-600 text-sm mb-1">{label}</p>
                <p className="text-3xl font-bold text-slate-800">
                  {(stats[key] ?? 0).toLocaleString("id-ID")}
                </p>
                {subKey !== undefined && (
                  <p className="text-xs text-slate-500 mt-1">
                    {(stats[subKey] ?? 0).toLocaleString("id-ID")} {subLabel}
                  </p>
                )}
              </div>
            );

            return to ? (
              <Link key={key} to={to} className="block">
                {card}
              </Link>
            ) : (
              <div key={key}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
