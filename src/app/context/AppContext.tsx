import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export type Role = "hr" | "employee" | null;

export interface AppContextType {
  isDark: boolean;
  toggleDark: () => void;
  role: Role;
  setRole: (role: Role) => void;
  jwt: string | null;
  setJwt: (jwt: string | null) => void;
  user: any | null;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [role, setRole] = useState<Role>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync dark mode class on HTML element
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);


  const toggleDark = () => setIsDark(prev => !prev);

  // Fetch role from employees table
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user role from database:", error);
        return null;
      }
      if (!data || data.length === 0) return null;
      return (data[0]?.role || null) as Role;
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
          const dbRole = await fetchUserRole(session.user.id);
          setRole(dbRole);
        } else {
          setUser(null);
          setJwt(null);
          setRole(null);
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
        const dbRole = await fetchUserRole(session.user.id);
        setRole(dbRole);
      } else {
        setUser(null);
        setJwt(null);
        setRole(null);
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
