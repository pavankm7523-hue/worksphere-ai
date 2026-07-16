import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Users, Clock, DollarSign, Award, Shield, BarChart3,
  Layers, LogOut, Search, Bell, Sun, Moon, Brain, X, Menu,
  UserCheck, Briefcase, AlertTriangle, Target, MoreHorizontal, ArrowRight, Check
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useIsMobile } from "../components/ui/use-mobile";
import { PageWrapper } from "../components/shared/PageWrapper";
import { Badge } from "../components/shared/Badge";
import { GradientButton } from "../components/shared/GradientButton";
import { ChartTooltipContent } from "../components/shared/ChartTooltipContent";
import { SkeletonCard } from "../components/shared/SkeletonCard";
import {
  attendanceData, recruitmentFunnel, attritionData,
  testimonials
} from "../lib/constants";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

import { supabase } from "../lib/supabaseClient";
import {
  getAllEmployees,
  getAllLeaveRequests,
  getAllAttendanceLogs,
  updateLeaveRequestStatus,
  LeaveRequest,
  Attendance,
  EmployeeProfile
} from "../lib/queries";

export default function HRDashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isDark, toggleDark } = useAppContext();
  const [activePage, setActivePage] = useState("overview");
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  // Real Database States
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHRDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [empList, leaveList, logsList] = await Promise.all([
        getAllEmployees(),
        getAllLeaveRequests(),
        getAllAttendanceLogs()
      ]);

      setEmployees(empList);
      setLeaveRequests(leaveList);
      setAttendanceLogs(logsList);
    } catch (err: any) {
      console.error("Error loading HR dashboard data:", err);
      setError(err?.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHRDashboardData();
  }, []);

  // Handle Approve/Reject action
  const handleStatusUpdate = async (requestId: number, newStatus: "approved" | "rejected") => {
    try {
      const updated = await updateLeaveRequestStatus(requestId, newStatus);
      // Update local state list
      setLeaveRequests(prev =>
        prev.map(req => req.id === requestId ? { ...req, status: updated.status } : req)
      );
    } catch (err: any) {
      alert("Failed to update leave request status: " + err.message);
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

  const navItems = [
    { id: "overview", icon: Home, label: "Overview" },
    { id: "recruitment", icon: Users, label: "Recruitment", action: () => navigate("/recruitment") },
    { id: "attendance", icon: Clock, label: "Attendance" },
    { id: "payroll", icon: DollarSign, label: "Payroll" },
    { id: "performance", icon: Award, label: "Performance" },
    { id: "compliance", icon: Shield, label: "Compliance" },
    { id: "reports", icon: BarChart3, label: "Reports" },
  ];

  // Dynamic KPI calculations
  const totalStaffCount = employees.length;
  
  // Calculate attendance rate for today
  const todayDateStr = new Date().toISOString().split("T")[0];
  const checkedInToday = attendanceLogs.filter(log => log.date === todayDateStr).length;
  const attendancePercentage = totalStaffCount > 0 
    ? Math.round((checkedInToday / totalStaffCount) * 100) 
    : 94; // fallback to baseline

  const kpis = [
    { label: "Total Employees", value: totalStaffCount.toString(), change: `+${totalStaffCount}`, up: true, icon: Users, color: "#7c3aed" },
    { label: "Attendance Rate", value: `${attendancePercentage}%`, change: "Live", up: true, icon: UserCheck, color: "#22d3ee" },
    { label: "Open Positions", value: "23", change: "+3", up: true, icon: Briefcase, color: "#6366f1" },
    { label: "Attrition Risk (Placeholder)", value: "8.3%", change: "-1.4%", up: false, icon: AlertTriangle, color: "#f43f5e" },
    { label: "Avg Performance (Placeholder)", value: "4.1/5", change: "+0.2", up: true, icon: Target, color: "#10b981" },
    { label: "Time to Hire", value: "11 days", change: "-8d", up: false, icon: Clock, color: "#f59e0b" },
  ];

  // Calculate dynamic department distribution
  const getDeptDistribution = () => {
    const counts: Record<string, number> = {};
    employees.forEach(emp => {
      const dept = emp.department || "Engineering";
      counts[dept] = (counts[dept] || 0) + 1;
    });

    const colors = ["#7c3aed", "#22d3ee", "#10b981", "#6366f1", "#f43f5e", "#f59e0b"];
    const entries = Object.keys(counts).map((dept, i) => ({
      name: dept,
      value: counts[dept],
      fill: colors[i % colors.length]
    }));

    if (entries.length === 0) {
      // Fallback baseline for visual aesthetics when table is empty
      return [
        { name: "Engineering", value: 4, fill: "#7c3aed" },
        { name: "Design", value: 2, fill: "#22d3ee" },
        { name: "HR", value: 1, fill: "#10b981" }
      ];
    }
    return entries;
  };

  const deptDistribution = getDeptDistribution();

  const notifications = [
    { type: "risk", text: "3 employees flagged as high attrition risk in Engineering", time: "5m ago" },
    { type: "review", text: "47 performance reviews due in 6 days", time: "1h ago" },
    { type: "leave", text: "Sarah Chen approved 2-week leave for James Wu", time: "2h ago" },
    { type: "hire", text: "Tom Brennan accepted Senior Backend Engineer offer", time: "4h ago" },
  ];

  const typeColors: Record<string, string> = {
    circle: "#7c3aed", hire: "#7c3aed", leave: "#22d3ee", payroll: "#10b981", success: "#34d399", risk: "#f43f5e"
  };

  const dynamicStyles = {
    sidebarBg: isDark ? "#0a0a18" : "#f1efff",
    sidebarBorder: isDark ? "border-white/[0.05]" : "border-black/[0.08]",
    topBarBg: isDark ? "rgba(8,8,15,0.8)" : "rgba(247,247,252,0.8)",
    topBarBorder: isDark ? "border-white/[0.05]" : "border-black/[0.08]",
    cardBg: isDark ? "bg-white/[0.02]" : "bg-black/[0.02]",
    cardBorder: isDark ? "border-white/[0.06]" : "border-black/[0.06]",
    textMuted: isDark ? "text-muted-foreground" : "text-slate-500",
    btnBorder: isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.08] bg-black/[0.02]",
    dropdownBg: isDark ? "#0d0d1c" : "#ffffff",
    dropdownBorder: isDark ? "border-white/[0.08]" : "border-black/[0.08]",
    divider: isDark ? "bg-white/[0.05]" : "bg-black/[0.05]"
  };

  if (loading) {
    return (
      <PageWrapper className="bg-background text-foreground min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest font-mono-data">Loading Dashboard...</span>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="text-red-400 mx-auto" size={24} />
          <h2 className="text-xl font-bold">Failed to Load HR Dashboard</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <GradientButton onClick={() => loadHRDashboardData()} size="md">
            Retry Connection
          </GradientButton>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="bg-background text-foreground min-h-screen flex transition-colors duration-200 relative">
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 220 : isMobile ? 0 : 64 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`flex-shrink-0 flex flex-col border-r overflow-hidden transition-all duration-200 z-50 ${
          isMobile ? "fixed left-0 top-0 bottom-0 h-full" : ""
        }`}
        style={{
          background: dynamicStyles.sidebarBg,
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"
        }}
      >
        <div className={`flex items-center justify-between p-4 h-16 border-b`} style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              <Brain size={15} className="text-white" />
            </div>
            {sidebarOpen && <span className="font-display font-bold text-sm text-foreground whitespace-nowrap">WorkSphere</span>}
          </div>
          {isMobile && sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none">
              <X size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ id, icon: Icon, label, action }) => (
            <motion.button
              key={id}
              onClick={() => {
                if (action) action();
                else setActivePage(id);
                if (isMobile) setSidebarOpen(false);
              }}
              whileHover={{ x: 2 }}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer ${
                activePage === id
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
              {activePage === id && sidebarOpen && (
                <motion.div layoutId="indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
              )}
            </motion.button>
          ))}
        </nav>

        <div className={`p-3 border-t`} style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }}>
          {!isMobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors cursor-pointer bg-transparent border-none">
              <Layers size={16} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Collapse</span>}
            </button>
          )}
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/"); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none">
            <LogOut size={16} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 h-16 border-b flex-shrink-0 backdrop-blur-2xl transition-all"
          style={{
            background: dynamicStyles.topBarBg,
            borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"
          }}
        >
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none">
                <Menu size={20} />
              </button>
            )}
            <h2 className="font-display font-bold text-base text-foreground capitalize">{activePage}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search candidates, reports, logs..."
                className="w-64 rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-violet-500/50"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
            </div>

            <motion.button whileHover={{ scale: 1.05 }} onClick={toggleDark} className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer">
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </motion.button>

            <div className="relative">
              <motion.button onClick={() => setNotifOpen(!notifOpen)} whileHover={{ scale: 1.05 }} className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer">
                <Bell size={13} />
              </motion.button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-72 rounded-xl border p-4 shadow-xl z-50"
                    style={{ background: dynamicStyles.dropdownBg, borderColor: dynamicStyles.dropdownBorder }}
                  >
                    <p className="text-xs font-semibold text-foreground mb-3">System Alerts</p>
                    <div className="space-y-3">
                      {notifications.map((n, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.type === "risk" ? "bg-red-400" : "bg-violet-400"}`} />
                          <div>
                            <p className="text-[11px] text-foreground leading-normal">{n.text}</p>
                            <p className="text-[9px] text-muted-foreground font-mono-data mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={`w-[1px] h-6 ${dynamicStyles.divider}`} />

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>HR</div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-foreground">Sarah Chen</p>
                <p className="text-[10px] text-muted-foreground">Admin Portal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map(({ label, value, change, up, icon: Icon, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3 }}
                className={`rounded-2xl border p-4 flex flex-col justify-between ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <span className={`text-[10px] font-semibold font-mono-data ${up ? "text-emerald-400" : "text-red-400"}`}>{change}</span>
                </div>
                <p className="text-xl font-display font-bold text-foreground mb-0.5">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            {/* Attendance Area Chart */}
            <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground font-display">Attendance Trends</p>
                  <p className="text-xs text-muted-foreground">6-month historical baseline</p>
                </div>
                <Badge color="violet">Baseline</Badge>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} />
                    <XAxis dataKey="month" tick={{ fill: isDark ? "#64748b" : "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: isDark ? "#64748b" : "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="present" stroke="#7c3aed" strokeWidth={2} fill="url(#attGrad)" name="Present %" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attrition Risk (Placeholder comment: keeping attritionData historical chart baseline) */}
            <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground font-display">Attrition Risk vs Actual (Placeholder)</p>
                  <p className="text-xs text-muted-foreground">Historical attrition projections</p>
                </div>
                <Badge color="red">Risk Projections</Badge>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attritionData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} />
                    <XAxis dataKey="month" tick={{ fill: isDark ? "#64748b" : "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: isDark ? "#64748b" : "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={2} dot={false} name="Flagged" />
                    <Line type="monotone" dataKey="actual" stroke="#22d3ee" strokeWidth={2} dot={false} name="Departed" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Recruitment Funnel */}
            <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-foreground font-display">Recruitment Funnel</p>
                <button onClick={() => navigate("/recruitment")} className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium cursor-pointer bg-transparent border-none">
                  View Kanban →
                </button>
              </div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recruitmentFunnel} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 60 }}>
                    <XAxis type="number" tick={{ fill: isDark ? "#64748b" : "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="stage" tick={{ fill: isDark ? "#64748b" : "#475569", fontSize: 9 }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Candidates">
                      {recruitmentFunnel.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dept Distribution */}
            <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground font-display">Department Distribution</p>
                <p className="text-xs text-muted-foreground">{totalStaffCount} live profiles</p>
              </div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deptDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {deptDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {deptDistribution.slice(0, 4).map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                    <span className="text-[10px] text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Pending Leave Requests */}
            <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-foreground font-display">Pending Leave Requests</p>
                <Badge color="violet">Review Needed</Badge>
              </div>
              <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 180 }}>
                {leaveRequests.filter(r => r.status === "pending").map((req, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.02] flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">{req.employees?.full_name || "Staff Member"}</p>
                        <p className="text-[10px] text-muted-foreground font-mono-data">{req.type} · {req.start_date} to {req.end_date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleStatusUpdate(req.id, "rejected")}
                        className="px-2 py-1 rounded text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold cursor-pointer border border-red-500/20"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(req.id, "approved")}
                        className="px-2 py-1 rounded text-[10px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-semibold cursor-pointer border border-emerald-500/20"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
                {leaveRequests.filter(r => r.status === "pending").length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-10">No pending leave requests.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
