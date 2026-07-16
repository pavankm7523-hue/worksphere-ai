import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import AuthPage from "./pages/AuthPage";
import BriefingPage from "./pages/BriefingPage";
import HRDashboardPage from "./pages/HRDashboardPage";
import EmployeeDashboardPage from "./pages/EmployeeDashboardPage";
import RecruitmentPage from "./pages/RecruitmentPage";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/role-select" element={<RoleSelectPage />} />
          <Route path="/login" element={<AuthPage />} />

          {/* HR Admin Protected Routes */}
          <Route
            path="/briefing"
            element={
              <ProtectedRoute allowedRole="hr">
                <BriefingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/hr"
            element={
              <ProtectedRoute allowedRole="hr">
                <HRDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment"
            element={
              <ProtectedRoute allowedRole="hr">
                <RecruitmentPage />
              </ProtectedRoute>
            }
          />

          {/* Employee Protected Routes */}
          <Route
            path="/dashboard/employee"
            element={
              <ProtectedRoute allowedRole="employee">
                <EmployeeDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
