import React from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "hr" | "employee";
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, jwt, role, loading } = useAppContext();

  // Render a clean loading screen during startup checks
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          </div>
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Verifying Session...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login page
  if (!user || !jwt) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch -> Redirect to the user's appropriate workspace
  if (allowedRole && role !== allowedRole) {
    if (role === "employee") {
      return <Navigate to="/dashboard/employee" replace />;
    } else if (role === "hr") {
      return <Navigate to="/dashboard/hr" replace />;
    } else {
      // Session exists but no employee database profile was found
      return <Navigate to="/role-select" replace />;
    }
  }

  return <>{children}</>;
}
