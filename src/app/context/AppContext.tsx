import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// Extended Role supports manager
export type Role = "hr" | "employee" | "manager" | null;

export interface AppContextType {
  isDark: boolean;
  toggleDark: () => void;
  role: Role;
  setRole: (role: Role) => void;
  companyId: number | null;
  setCompanyId: (id: number | null) => void;
  userStatus: "pending" | "active" | "denied" | null;
  setUserStatus: (status: "pending" | "active" | "denied" | null) => void;
  jwt: string | null;
  setJwt: (jwt: string | null) => void;
  user: any | null;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [role, setRole] = useState<Role>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [userStatus, setUserStatus] = useState<"pending" | "active" | "denied" | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync dark mode class on HTML element
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleDark = () => setIsDark(prev => !prev);

  // Fetch full profile info (role, company_id, status) from employees table
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("role, company_id, status")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user profile from database:", error);
        return null;
      }
      if (!data || data.length === 0) return null;
      return data[0];
    } catch (err) {
      console.error("Unexpected error fetching employee profile:", err);
      return null;
    }
  };

  useEffect(() => {
    // 1. Get initial session
    const getInitialSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          setJwt(session.access_token);
          const profile = await fetchUserProfile(session.user.id);
          setRole(profile?.role || null);
          setCompanyId(profile?.company_id || null);
          setUserStatus(profile?.status || null);
        } else {
          setUser(null);
          setJwt(null);
          setRole(null);
          setCompanyId(null);
          setUserStatus(null);
        }
      } catch (error) {
        console.error("Error checking initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (session) {
        setUser(session.user);
        setJwt(session.access_token);
        const profile = await fetchUserProfile(session.user.id);
        setRole(profile?.role || null);
        setCompanyId(profile?.company_id || null);
        setUserStatus(profile?.status || null);
      } else {
        setUser(null);
        setJwt(null);
        setRole(null);
        setCompanyId(null);
        setUserStatus(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        isDark,
        toggleDark,
        role,
        setRole,
        companyId,
        setCompanyId,
        userStatus,
        setUserStatus,
        jwt,
        setJwt,
        user,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
