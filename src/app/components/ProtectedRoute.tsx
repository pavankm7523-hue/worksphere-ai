import React from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { Clock, AlertTriangle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "hr" | "employee" | "manager";
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, jwt, role, userStatus, loading } = useAppContext();

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

  // Check access request status for pending/denied accounts
  if (userStatus === "pending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md text-center space-y-6 bg-white/[0.02] border border-white/[0.08] p-8 rounded-3xl backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.2))", border: "1px solid rgba(124,58,237,0.3)" }}>
            <Clock className="text-violet-400" size={24} />
          </div>
          <h2 className="text-2xl font-bold font-display">Registration Pending</h2>
          <p className="text-sm text-muted-foreground leading-relaxed font-sans">
            {role === "hr"
              ? "Your HR Administrator account is being set up. Please contact WorkSphere support if this persists."
              : "Your access request is currently pending HR approval. You will be able to access your dashboard once an administrator activates your account."}
          </p>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-foreground border border-white/[0.08] cursor-pointer transition-all">
            Sign Out
          </button>
        </div>
      </div>
    );
  }
  if (userStatus === "denied") {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-md text-center space-y-6 bg-white/[0.02] border border-white/[0.08] p-8 rounded-3xl backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" }}>
              <AlertTriangle className="text-rose-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold font-display text-rose-400">Access Denied</h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              Your access request was denied. Contact your HR administrator.
            </p>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-foreground border border-white/[0.08] cursor-pointer transition-all">
              Sign Out
            </button>
          </div>
        </div>
    );
  }

  // Role mismatch -> Redirect to the user's appropriate workspace
  if (allowedRole && role !== allowedRole) {
    if (role === "employee") {
      return <Navigate to="/dashboard/employee" replace />;
    } else if (role === "manager") {
      return <Navigate to="/dashboard/manager" replace />;
    } else if (role === "hr") {
      return <Navigate to="/dashboard/hr" replace />;
    } else {
      // Session exists but no profile workspace is active
      return <Navigate to="/role-select" replace />;
    }
  }

  return <>{children}</>;
}
