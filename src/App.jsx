// src/App.jsx

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ToastProvider } from "./context/ToastContext";
import MainLayout from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HeroManager from "./pages/Hero/HeroManager";
import ServiceList from "./pages/Services/ServiceList";
import EventList from "./pages/Events/EventList";
import ArticleList from "./pages/Articles/ArticleList";
import CareerList from "./pages/Career/CareerList";
import ApplicationList from "./pages/Application/ApplicationList";
import ForumList from "./pages/Forum/ForumList";
import ConsultationList from "./pages/Consultation/ConsultationList";
import AssessmentList from "./pages/Assessment/AssessmentList";
import NotFound from "./pages/NotFound";

/**
 * Sebelumnya panel ini hanya punya satu route (`/*`) dan berpindah halaman
 * lewat state `activeMenu`. Akibatnya tidak ada URL yang bisa di-bookmark,
 * tombol back browser keluar dari aplikasi, dan refresh selalu balik ke
 * Dashboard. Sekarang setiap modul punya route-nya sendiri.
 */
function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="hero" element={<HeroManager />} />
            <Route path="services" element={<ServiceList />} />
            <Route path="events" element={<EventList />} />
            <Route path="articles" element={<ArticleList />} />
            <Route path="careers" element={<CareerList />} />
            <Route path="applications" element={<ApplicationList />} />
            <Route path="forum" element={<ForumList />} />
            <Route path="consultations" element={<ConsultationList />} />
            <Route path="assessments" element={<AssessmentList />} />

            {/* URL lama sebelum News diganti Articles */}
            <Route path="news" element={<Navigate to="/articles" replace />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
