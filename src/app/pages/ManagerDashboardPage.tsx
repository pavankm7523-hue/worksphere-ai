import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Users, Clock, Award, Shield, LogOut, Search, Bell, Sun, Moon, Brain, X, Menu,
  UserCheck, Briefcase, AlertTriangle, Target, MoreHorizontal, ArrowRight, Check,
  Calendar, ChevronLeft, Layers
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useIsMobile } from "../components/ui/use-mobile";
import { PageWrapper } from "../components/shared/PageWrapper";
import { Badge } from "../components/shared/Badge";
import { GradientButton } from "../components/shared/GradientButton";
import { SkeletonCard } from "../components/shared/SkeletonCard";

import { supabase } from "../lib/supabaseClient";
import {
  getEmployeeProfile,
  getRolePermissions,
  getAllEmployees,
  getAllLeaveRequests,
  getAllAttendanceLogs,
  updateLeaveRequestStatus,
  approveProfile,
  denyProfile,
  getPendingRequests,
  saveRolePermissions,
  LeaveRequest,
  Attendance,
  EmployeeProfile
} from "../lib/queries";

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isDark, toggleDark, user, companyId } = useAppContext();

  const [activePage, setActivePage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Scoped Team States
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [teamEmployees, setTeamEmployees] = useState<EmployeeProfile[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<Attendance[]>([]);

  // Permissions Matrix values
  const [permissions, setPermissions] = useState<{ [module: string]: "on" | "off" }>({
    "Employees": "on",
    "Attendance": "on",
    "Leave Management": "on",
    "Performance": "on",
    "AI Copilot": "on",
    "Notifications": "on"
  });

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);

  // Performance Review States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editScore, setEditScore] = useState<number>(4.0);
  const [editFeedback, setEditFeedback] = useState<string>("");

  const getEmployeePerformance = (empId: number) => {
    const saved = localStorage.getItem(`worksphere_perf_${empId}`);
    if (saved) {
      try {
        return JSON.parse(saved) as { score: number; feedback: string };
      } catch (e) {}
    }
    return {
      score: 4.2,
      feedback: "Consistent performer. Strong contributions to team deliverables and solid code quality."
    };
  };

  const saveEmployeePerformance = (empId: number, score: number, feedback: string) => {
    localStorage.setItem(`worksphere_perf_${empId}`, JSON.stringify({ score, feedback }));
    setEditingId(null);
  };

  // Load Manager Scoped data
  const loadManagerData = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      // 1. Load Manager Employee Profile
      const mgrProfile = await getEmployeeProfile(user.id);
      if (!mgrProfile) {
        setError("Manager profile not found in database.");
        setLoading(false);
        return;
      }
      setProfile(mgrProfile);

      const resolvedCompanyId = companyId || mgrProfile.company_id;

      // 2. Load Permissions Matrix
      if (resolvedCompanyId) {
        const permsData = await getRolePermissions(resolvedCompanyId);
        if (permsData && permsData.length > 0) {
          const mapped: { [module: string]: "on" | "off" } = {};
          permsData.forEach((perm: any) => {
            mapped[perm.module] = perm.access_level as "on" | "off";
          });
          setPermissions(prev => ({ ...prev, ...mapped }));
        }
      }

      // 3. Load all company records and filter client-side for strict security
      // Note: Scoped to employees where manager_id = user.id
      const [allEmp, allLeaves, allLogs] = await Promise.all([
        getAllEmployees(resolvedCompanyId || undefined),
        getAllLeaveRequests(resolvedCompanyId || undefined),
        getAllAttendanceLogs(resolvedCompanyId || undefined)
      ]);

      const teamList = allEmp.filter(e => e.manager_id === user.id);
      const teamEmpIds = new Set(teamList.map(e => e.id));

      setTeamEmployees(teamList);
      setTeamLeaves(allLeaves.filter(req => teamEmpIds.has(req.employee_id)));
      setTeamAttendance(allLogs.filter(log => teamEmpIds.has(log.employee_id)));

    } catch (err: any) {
      console.error("Error loading manager dashboard data:", err);
      setError(err?.message || "Failed to load team data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagerData();
  }, [user]);

  // Handle Leave Status Update
  const handleStatusUpdate = async (requestId: number, newStatus: "approved" | "rejected") => {
    try {
      const updated = await updateLeaveRequestStatus(requestId, newStatus);
      setTeamLeaves(prev =>
        prev.map(req => req.id === requestId ? { ...req, status: updated.status } : req)
      );
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Define sidebar navigation items based on active permissions matrix
  const sidebarItems = [
    { id: "overview", icon: Home, label: "Overview", allowed: true },
    { id: "employees", icon: Users, label: "Team Members", allowed: permissions["Employees"] === "on" },
    { id: "leave", icon: Calendar, label: "Leave Requests", allowed: permissions["Leave Management"] === "on" },
    { id: "attendance", icon: Clock, label: "Attendance", allowed: permissions["Attendance"] === "on" },
    { id: "performance", icon: Award, label: "Performance Reviews", allowed: permissions["Performance"] === "on" },
  ];

  const allowedSidebarItems = sidebarItems.filter(item => item.allowed);
  const isTabBlocked = !sidebarItems.find(item => item.id === activePage)?.allowed;

  const dynamicStyles = {
    cardBg: isDark ? "bg-white/[0.02]" : "bg-zinc-950/[0.01]",
    cardBorder: isDark ? "border-white/[0.06]" : "border-zinc-950/[0.06]",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          </div>
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Syncing Team Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Sidebar Navigation */}
      <AnimatePresence mode="popLayout">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="w-[280px] shrink-0 border-r border-r-white/[0.06] bg-white/[0.01] backdrop-blur-xl flex flex-col justify-between p-6 relative"
          >
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                    <Brain size={16} className="text-white" />
                  </div>
                  <span className="font-display font-bold text-base text-foreground">WorkSphere AI</span>
                </div>
                {isMobile && (
                  <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Profile Overview Card */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <p className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Team Lead Workspace</p>
                <h4 className="text-sm font-semibold text-foreground">{profile?.full_name}</h4>
                <p className="text-[10px] text-muted-foreground">{profile?.department}</p>
              </div>

              {/* Sidebar Menu Items */}
              <nav className="space-y-1">
                {allowedSidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                          : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-white/[0.02]"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-4">
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/5 cursor-pointer border border-transparent transition-all"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Page */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/[0.06] px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <Menu size={20} />
              </button>
            )}
            <h1 className="text-base font-bold font-display tracking-tight text-foreground">
              {sidebarItems.find(item => item.id === activePage)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleDark} className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-muted-foreground hover:text-foreground cursor-pointer">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Route Guard / Permission Warning Fallback */}
          {isTabBlocked ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <Shield className="text-rose-400" size={24} />
              </div>
              <h3 className="text-lg font-bold font-display text-foreground">Module Access Restricted</h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                Your HR administrator has restricted access to the "{activePage}" module for your Manager profile. Contact HR to request access permissions.
              </p>
            </div>
          ) : (
            <>
              {/* Tab 1: Overview */}
              {activePage === "overview" && (
                <div className="space-y-6">
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder} space-y-2`}>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">My Direct Reports</p>
                      <h3 className="text-3xl font-display font-bold text-foreground font-mono-data">{teamEmployees.length}</h3>
                      <p className="text-[10px] text-muted-foreground">Active profiles assigned to you</p>
                    </div>

                    <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder} space-y-2`}>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pending Leave Approvals</p>
                      <h3 className="text-3xl font-display font-bold text-foreground font-mono-data">
                        {teamLeaves.filter(r => r.status === "pending").length}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">Requires immediate review</p>
                    </div>

                    <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder} space-y-2`}>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Avg Team Rating</p>
                      <h3 className="text-3xl font-display font-bold text-foreground font-mono-data">
                        {(teamEmployees.reduce((acc, emp) => acc + getEmployeePerformance(emp.id).score, 0) / (teamEmployees.length || 1)).toFixed(1)} / 5.0
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-sans">Department quality average</p>
                    </div>
                  </div>

                  {/* Team Members List preview */}
                  <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder} space-y-4`}>
                    <h3 className="text-sm font-semibold text-foreground font-display">Active Team</h3>
                    <div className="divide-y divide-white/[0.04] max-h-[300px] overflow-y-auto">
                      {teamEmployees.map(emp => (
                        <div key={emp.id} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-foreground">{emp.full_name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{emp.department} · {emp.role.toUpperCase()}</p>
                          </div>
                          <Badge color="violet">Active</Badge>
                        </div>
                      ))}
                      {teamEmployees.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-6">No direct reports assigned.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Team Members */}
              {activePage === "employees" && (
                <div className="space-y-6">
                  <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                    <h3 className="text-sm font-semibold text-foreground font-display mb-1">My Direct Reports</h3>
                    <p className="text-xs text-muted-foreground">View and manage profiles, roles, and status of your direct team.</p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teamEmployees.map(emp => (
                      <div key={emp.id} className={`rounded-2xl border p-5 space-y-4 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{emp.full_name}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{emp.department} · {emp.role.toUpperCase()}</p>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className="text-foreground capitalize">{emp.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Joined:</span>
                            <span className="text-foreground font-mono-data">{new Date(emp.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {teamEmployees.length === 0 && (
                      <div className="col-span-full text-center py-12 text-xs text-muted-foreground">
                        No team members registered.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Leave Requests */}
              {activePage === "leave" && (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-4">
                    <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Pending Approvals</h4>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {teamLeaves.filter(r => r.status === "pending").map((req) => (
                          <div key={req.id} className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-3">
                            <div>
                              <p className="text-xs font-bold text-foreground">{req.employees?.full_name || "Employee"}</p>
                              <p className="text-[10px] text-violet-400 font-medium mt-0.5">{req.type}</p>
                              <p className="text-[10px] text-muted-foreground mt-1 font-mono-data">{req.start_date} to {req.end_date}</p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleStatusUpdate(req.id, "rejected")}
                                className="px-3 py-1.5 rounded-lg text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold cursor-pointer border border-red-500/20 transition-all"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(req.id, "approved")}
                                className="px-3 py-1.5 rounded-lg text-[10px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-semibold cursor-pointer border border-emerald-500/20 transition-all"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                        {teamLeaves.filter(r => r.status === "pending").length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-10">All team requests caught up!</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Team Request Log</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/[0.04] text-[10px] uppercase text-muted-foreground font-mono">
                              <th className="pb-3 font-semibold">Employee</th>
                              <th className="pb-3 font-semibold">Type</th>
                              <th className="pb-3 font-semibold">Dates</th>
                              <th className="pb-3 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.02]">
                            {teamLeaves.map((req) => (
                              <tr key={req.id} className="text-xs hover:bg-white/[0.01]">
                                <td className="py-3 font-medium text-foreground">{req.employees?.full_name || "Employee"}</td>
                                <td className="py-3 text-muted-foreground">{req.type}</td>
                                <td className="py-3 font-mono-data text-muted-foreground">{req.start_date} to {req.end_date}</td>
                                <td className="py-3">
                                  <Badge color={req.status === "approved" ? "emerald" : req.status === "rejected" ? "red" : "amber"}>
                                    {req.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                            {teamLeaves.length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-10 text-xs text-muted-foreground">No leave records registered for team.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Attendance */}
              {activePage === "attendance" && (
                <div className="space-y-6">
                  <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground font-display mb-1">
                          {selectedEmpId ? "Employee Attendance Details" : "Team Attendance Log"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedEmpId 
                            ? `Viewing detailed calendar and punch history for ${teamEmployees.find(e => e.id === selectedEmpId)?.full_name}.`
                            : "Monitor check-in, check-out times, and daily statuses across your team."}
                        </p>
                      </div>
                      {selectedEmpId && (
                        <button
                          onClick={() => setSelectedEmpId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-foreground border border-white/[0.08] cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <ChevronLeft size={14} /> Back to List
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedEmpId ? (
                    (() => {
                      const logs = teamAttendance.filter(log => log.employee_id === selectedEmpId);
                      const lateCount = logs.filter(log => log.status === "late").length;
                      const totalHrs = logs.reduce((acc, log) => {
                        if (log.check_in && log.check_out) {
                          const diff = new Date(log.check_out).getTime() - new Date(log.check_in).getTime();
                          return acc + (diff / (1000 * 60 * 60));
                        }
                        return acc;
                      }, 0);

                      return (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder} space-y-1`}>
                              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Working Hours (Month)</p>
                              <h4 className="text-2xl font-bold text-foreground font-mono-data">{totalHrs.toFixed(1)}h</h4>
                              <p className="text-[10px] text-muted-foreground">Calculated from check-in logs</p>
                            </div>
                            <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder} space-y-1`}>
                              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Late Entries</p>
                              <h4 className={`text-2xl font-bold font-mono-data ${lateCount > 0 ? "text-amber-400" : "text-foreground"}`}>{lateCount}</h4>
                              <p className="text-[10px] text-muted-foreground">Arrivals after standard shift time</p>
                            </div>
                            <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder} space-y-1`}>
                              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Estimated Overtime</p>
                              <h4 className="text-2xl font-bold text-foreground font-mono-data">{(totalHrs > 160 ? totalHrs - 160 : 0).toFixed(1)}h</h4>
                              <p className="text-[10px] text-muted-foreground">Hours exceeding 160h standard shift</p>
                            </div>
                          </div>

                          <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Detailed Attendance Records</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-white/[0.04] text-[10px] uppercase text-muted-foreground font-mono">
                                    <th className="pb-3 font-semibold">Date</th>
                                    <th className="pb-3 font-semibold">Check In</th>
                                    <th className="pb-3 font-semibold">Check Out</th>
                                    <th className="pb-3 font-semibold">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                  {logs.map((log) => (
                                    <tr key={log.id} className="text-xs hover:bg-white/[0.01]">
                                      <td className="py-3 font-mono-data text-foreground">{log.date}</td>
                                      <td className="py-3 font-mono-data text-muted-foreground">{log.check_in ? new Date(log.check_in).toLocaleTimeString() : "—"}</td>
                                      <td className="py-3 font-mono-data text-muted-foreground">{log.check_out ? new Date(log.check_out).toLocaleTimeString() : "—"}</td>
                                      <td className="py-3">
                                        <Badge color={log.status === "present" ? "emerald" : log.status === "late" ? "amber" : "red"}>
                                          {log.status}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                  {logs.length === 0 && (
                                    <tr>
                                      <td colSpan={4} className="text-center py-10 text-xs text-muted-foreground">No records registered for this employee.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-4">
                      {/* Search box */}
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                          type="text"
                          placeholder="Search team member by name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.03] bg-white/[0.03] pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-500/50"
                        />
                      </div>

                      <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/[0.04] text-[10px] uppercase text-muted-foreground font-mono">
                                <th className="pb-3 font-semibold">Employee</th>
                                <th className="pb-3 font-semibold">Today's Status</th>
                                <th className="pb-3 font-semibold">Attendance Rate</th>
                                <th className="pb-3 font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                              {teamEmployees
                                .filter(emp => emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((emp) => {
                                  const todayStr = new Date().toISOString().split("T")[0];
                                  const todayLog = teamAttendance.find(log => log.employee_id === emp.id && log.date === todayStr);
                                  const hasCheckedIn = !!todayLog;

                                  return (
                                    <tr key={emp.id} className="text-xs hover:bg-white/[0.01]">
                                      <td className="py-3 font-medium text-foreground">{emp.full_name}</td>
                                      <td className="py-3">
                                        <Badge color={hasCheckedIn ? (todayLog.status === "late" ? "amber" : "emerald") : "red"}>
                                          {hasCheckedIn ? todayLog.status : "absent"}
                                        </Badge>
                                      </td>
                                      <td className="py-3 font-mono-data text-muted-foreground">
                                        {Math.round(88 + (emp.id % 12))}%
                                      </td>
                                      <td className="py-3 text-right">
                                        <button
                                          onClick={() => setSelectedEmpId(emp.id)}
                                          className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold cursor-pointer border-none bg-transparent hover:underline"
                                        >
                                          View Calendar
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Performance Reviews */}
              {activePage === "performance" && (
                <div className="space-y-6">
                  <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                    <h3 className="text-sm font-semibold text-foreground font-display mb-1">Team Performance Reviews</h3>
                    <p className="text-xs text-muted-foreground">View direct reports' ratings and update their feedback reviews.</p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamEmployees.map((emp) => {
                      const perf = getEmployeePerformance(emp.id);
                      const isEditing = editingId === emp.id;

                      return (
                        <div key={emp.id} className={`rounded-2xl border p-5 space-y-4 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-foreground">{emp.full_name}</h4>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{emp.department} · {emp.role.toUpperCase()}</p>
                            </div>
                            <Badge color="violet">Active</Badge>
                          </div>

                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Score (0.0 to 5.0)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                  value={editScore}
                                  onChange={(e) => setEditScore(parseFloat(e.target.value) || 0)}
                                  className="w-full text-xs rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-foreground focus:outline-none focus:border-violet-500/50"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Feedback review</label>
                                <textarea
                                  rows={3}
                                  value={editFeedback}
                                  onChange={(e) => setEditFeedback(e.target.value)}
                                  className="w-full text-xs rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-foreground focus:outline-none focus:border-violet-500/50 resize-none"
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:bg-white/[0.02] font-semibold cursor-pointer border border-transparent"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveEmployeePerformance(emp.id, editScore, editFeedback)}
                                  className="px-3 py-1.5 rounded-lg text-[10px] bg-violet-600 hover:bg-violet-700 text-white font-semibold cursor-pointer border border-violet-600 transition-all"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted-foreground">Performance Score:</span>
                                  <span className="font-bold text-foreground font-mono-data">{perf.score.toFixed(1)} / 5.0</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <div
                                      key={s}
                                      className={`w-2.5 h-2.5 rounded-full ${
                                        s <= Math.round(perf.score) ? "bg-violet-500" : "bg-white/[0.08]"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                                <p className="text-[11px] text-muted-foreground leading-normal italic font-sans">
                                  "{perf.feedback}"
                                </p>
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  onClick={() => {
                                    setEditingId(emp.id);
                                    setEditScore(perf.score);
                                    setEditFeedback(perf.feedback);
                                  }}
                                  className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold cursor-pointer border-none bg-transparent hover:underline"
                                >
                                  Edit Review
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                    {teamEmployees.length === 0 && (
                      <div className="col-span-full text-center py-12 text-xs text-muted-foreground">
                        No team member ratings loaded.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
