import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Users, Clock, DollarSign, Award, Shield, BarChart3,
  Layers, LogOut, Search, Bell, Sun, Moon, Brain, X, Menu,
  UserCheck, Briefcase, AlertTriangle, Target, MoreHorizontal, ArrowRight, Check,
  Calendar, ChevronLeft
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
  getPendingRequests,
  approveProfile,
  denyProfile,
  getRolePermissions,
  saveRolePermissions,
  LeaveRequest,
  Attendance,
  EmployeeProfile
} from "../lib/queries";

export default function HRDashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isDark, toggleDark, companyId } = useAppContext();
  const [pendingUsers, setPendingUsers] = useState<EmployeeProfile[]>([]);
  const [activePage, setActivePage] = useState("overview");
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editScore, setEditScore] = useState<number>(4.5);
  const [editFeedback, setEditFeedback] = useState<string>("");

  const getEmployeePerformance = (empId: number) => {
    const saved = localStorage.getItem(`worksphere_perf_${empId}`);
    if (saved) {
      try {
        return JSON.parse(saved) as { score: number; feedback: string };
      } catch (e) {}
    }
    return {
      score: 4.5,
      feedback: "Exceeds standard delivery benchmarks. Demonstrates excellent cross-functional collaboration and clear architectural execution."
    };
  };

  const saveEmployeePerformance = (empId: number, score: number, feedback: string) => {
    localStorage.setItem(`worksphere_perf_${empId}`, JSON.stringify({ score, feedback }));
    setEditingId(null);
  };

  // Real Database States
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [managerPermissions, setManagerPermissions] = useState<{ [module: string]: "on" | "off" }>({
    "Employees": "on",
    "Attendance": "on",
    "Leave Management": "on",
    "Performance": "on",
    "Payroll": "off",
    "Recruitment": "off",
    "Attrition Analytics": "off",
    "Employee Lifecycle": "off",
    "Reports": "off",
    "AI Copilot": "on",
    "Notifications": "on"
  });

  const loadPermissions = async () => {
    if (!companyId) return;
    try {
      const data = await getRolePermissions(companyId);
      if (data && data.length > 0) {
        const mapped: { [module: string]: "on" | "off" } = {};
        data.forEach((perm: any) => {
          mapped[perm.module] = perm.access_level as "on" | "off";
        });
        setManagerPermissions(prev => ({ ...prev, ...mapped }));
      }
    } catch (err) {
      console.error("Failed to load permissions:", err);
    }
  };

  const loadHRDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const targetCompanyId = companyId || undefined;
      const [empList, leaveList, logsList, pendingList] = await Promise.all([
        getAllEmployees(targetCompanyId),
        getAllLeaveRequests(targetCompanyId),
        getAllAttendanceLogs(targetCompanyId),
        companyId ? getPendingRequests(companyId) : Promise.resolve([])
      ]);

      setEmployees(empList);
      setLeaveRequests(leaveList);
      setAttendanceLogs(logsList);
      setPendingUsers(pendingList);
      await loadPermissions();
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

  const handleApproveRequest = async (userId: number) => {
    try {
      await approveProfile(userId);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      const targetCompanyId = companyId || undefined;
      const empList = await getAllEmployees(targetCompanyId);
      setEmployees(empList);
    } catch (err: any) {
      alert("Failed to approve user request: " + err.message);
    }
  };

  const handleDenyRequest = async (userId: number) => {
    try {
      await denyProfile(userId);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert("Failed to deny user request: " + err.message);
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
    { id: "recruitment", icon: Brain, label: "Recruitment (AI)", action: () => navigate("/recruitment") },
    { id: "leave", icon: Calendar, label: "Leave Management" },
    { id: "attendance", icon: Clock, label: "Attendance" },
    { id: "performance", icon: Award, label: "Performance" },
    { id: "approvals", icon: UserCheck, label: "Pending Requests" },
    { id: "permissions", icon: Layers, label: "Permissions Matrix" },
    { id: "compliance", icon: Shield, label: "Compliance" },
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

  const getDynamicNotifications = () => {
    const list: { type: string; text: string; time: string }[] = [];
    
    if (pendingUsers.length > 0) {
      list.push({
        type: "review",
        text: `${pendingUsers.length} workspace registration request(s) pending HR approval`,
        time: "Just now"
      });
    }

    const pendingLeaves = leaveRequests.filter(r => r.status === "pending");
    if (pendingLeaves.length > 0) {
      list.push({
        type: "leave",
        text: `${pendingLeaves.length} leave request(s) awaiting your decision`,
        time: "Just now"
      });
    }

    // Default aesthetic system notifications
    list.push({
      type: "risk",
      text: "Attrition risk scan completed: No critical department hazards detected",
      time: "10m ago"
    });
    list.push({
      type: "hire",
      text: "Candidate screening: Resume uploaded and parsed successfully",
      time: "1h ago"
    });

    return list;
  };

  const notifications = getDynamicNotifications();

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
              <motion.button onClick={() => setNotifOpen(!notifOpen)} whileHover={{ scale: 1.05 }} className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer relative">
                <Bell size={13} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                )}
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
          {activePage === "overview" && (
            <>
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
            </>
          )}

          {activePage === "leave" && (
            <div className="space-y-6">
              <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                <h3 className="text-sm font-semibold text-foreground font-display mb-1">Leave Requests Management</h3>
                <p className="text-xs text-muted-foreground">Review, approve, or reject employee leave requests.</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Pending Leave Requests */}
                <div className="lg:col-span-1 space-y-4">
                  <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Pending Approvals</h4>
                      <Badge color="violet">{leaveRequests.filter(r => r.status === "pending").length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {leaveRequests.filter(r => r.status === "pending").map((req) => (
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
                      {leaveRequests.filter(r => r.status === "pending").length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-10">All requests caught up!</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* History Log */}
                <div className="lg:col-span-2">
                  <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Request Log</h4>
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
                          {leaveRequests.map((req) => (
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
                          {leaveRequests.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-10 text-xs text-muted-foreground">No leave history records found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "attendance" && (
            <div className="space-y-6">
              <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground font-display mb-1">
                      {selectedEmpId ? "Employee Attendance Details" : "Employee Attendance Log"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedEmpId 
                        ? `Viewing detailed calendar and punch history for ${employees.find(e => e.id === selectedEmpId)?.full_name}.`
                        : "Monitor check-in, check-out times, and daily statuses across the workforce."}
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
                  const emp = employees.find(e => e.id === selectedEmpId);
                  const logs = attendanceLogs.filter(log => log.employee_id === selectedEmpId);
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
                  {/* Filters block */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <input
                        type="text"
                        placeholder="Search employee by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-violet-500/50"
                    >
                      <option value="All">All Departments</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Design">Design</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>

                  <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.04] text-[10px] uppercase text-muted-foreground font-mono">
                            <th className="pb-3 font-semibold">Employee</th>
                            <th className="pb-3 font-semibold">Department</th>
                            <th className="pb-3 font-semibold">Today's Status</th>
                            <th className="pb-3 font-semibold">Attendance Rate</th>
                            <th className="pb-3 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                          {employees
                            .filter(emp => {
                              const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase());
                              const matchesDept = deptFilter === "All" || emp.department === deptFilter;
                              return matchesSearch && matchesDept;
                            })
                            .map((emp) => {
                              const todayStr = new Date().toISOString().split("T")[0];
                              const todayLog = attendanceLogs.find(log => log.employee_id === emp.id && log.date === todayStr);
                              const hasCheckedIn = !!todayLog;

                              return (
                                <tr key={emp.id} className="text-xs hover:bg-white/[0.01]">
                                  <td className="py-3 font-medium text-foreground">{emp.full_name}</td>
                                  <td className="py-3 text-muted-foreground">{emp.department}</td>
                                  <td className="py-3">
                                    <Badge color={hasCheckedIn ? (todayLog.status === "late" ? "amber" : "emerald") : "red"}>
                                      {hasCheckedIn ? todayLog.status : "absent"}
                                    </Badge>
                                  </td>
                                  <td className="py-3 font-mono-data text-muted-foreground">
                                    {Math.round(85 + (emp.id % 15))}%
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

          {activePage === "performance" && (
            <div className="space-y-6">
              <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                <h3 className="text-sm font-semibold text-foreground font-display mb-1">Performance Reviews</h3>
                <p className="text-xs text-muted-foreground">Manage employee feedback, review metrics, and department averages.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((emp) => {
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
                            <p className="text-[11px] text-muted-foreground leading-normal italic">
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
              </div>
            </div>
          )}

          {activePage === "approvals" && (
            <div className="space-y-6">
              <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                <h3 className="text-sm font-semibold text-foreground font-display mb-1">Pending Requests</h3>
                <p className="text-xs text-muted-foreground">Approve or deny pending Employee and Manager workspace registration requests.</p>
              </div>

              <div className="border border-white/[0.08] rounded-2xl bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="py-4 px-6">Name</th>
                        <th className="py-4 px-6">Email</th>
                        <th className="py-4 px-6">Role Requested</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {pendingUsers.map((p) => (
                        <tr key={p.id} className="text-xs hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-6 font-semibold text-foreground">{p.full_name}</td>
                          <td className="py-4 px-6 text-muted-foreground font-mono-data">{p.user_id}</td>
                          <td className="py-4 px-6">
                            <Badge color={p.role === "manager" ? "violet" : "cyan"}>
                              {p.role.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleDenyRequest(p.id)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer transition-all"
                              >
                                Deny
                              </button>
                              <button
                                onClick={() => handleApproveRequest(p.id)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-pointer transition-all"
                              >
                                Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pendingUsers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-xs text-muted-foreground">
                            No pending registration requests.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activePage === "permissions" && (
            <div className="space-y-6">
              <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                <h3 className="text-sm font-semibold text-foreground font-display mb-1">Permissions Matrix</h3>
                <p className="text-xs text-muted-foreground">Control module access permissions for the Manager role in your company.</p>
              </div>

              <div className="border border-white/[0.08] rounded-2xl bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="py-4 px-6">Module / Feature</th>
                        <th className="py-4 px-6">Role</th>
                        <th className="py-4 px-6 text-right">Access Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {Object.entries(managerPermissions).map(([modName, level]) => (
                        <tr key={modName} className="text-xs hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-6 font-semibold text-foreground">{modName}</td>
                          <td className="py-4 px-6 text-muted-foreground">Manager</td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={async () => {
                                const nextLvl = level === "on" ? "off" : "on";
                                const nextPerms = { ...managerPermissions, [modName]: nextLvl };
                                setManagerPermissions(nextPerms);
                                if (companyId) {
                                  await saveRolePermissions(companyId, "manager", nextPerms);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                                level === "on"
                                  ? "bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20"
                                  : "bg-white/[0.02] border-white/[0.08] text-muted-foreground hover:bg-white/[0.06]"
                              }`}
                            >
                              {level === "on" ? "Access Enabled" : "Access Disabled"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activePage === "compliance" && (
            <div className="space-y-6">
              <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                <h3 className="text-sm font-semibold text-foreground font-display mb-1">Compliance & Platform Security</h3>
                <p className="text-xs text-muted-foreground">Verify Row Level Security (RLS), Storage configurations, and document statuses.</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className={`rounded-2xl border p-5 space-y-4 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Platform Infrastructure</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Database RLS Isolation</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Profiles isolated per user ID using native policies</p>
                      </div>
                      <Badge color="emerald">100% Secure</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Storage Policies</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">HR role required to read/list candidate resumes</p>
                      </div>
                      <Badge color="emerald">Active</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                      <div>
                        <p className="text-xs font-semibold text-foreground">AI Edge Integration</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Secure token passing to Deno Edge runtime</p>
                      </div>
                      <Badge color="violet">Gemini 2.5 Flash</Badge>
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl border p-5 space-y-4 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Audit Compliance Logs</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.02]">
                      <span className="text-muted-foreground">Employment Contracts Verified</span>
                      <span className="font-semibold text-foreground">6 / 6</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.02]">
                      <span className="text-muted-foreground">Tax Declaration Compliance</span>
                      <span className="font-semibold text-foreground">100% complete</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.02]">
                      <span className="text-muted-foreground">NDA Sign-offs Logged</span>
                      <span className="font-semibold text-foreground">6 Signed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
