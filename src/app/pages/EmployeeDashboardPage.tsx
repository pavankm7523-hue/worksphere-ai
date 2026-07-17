import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, DollarSign, Target, Plus, FileText, MessageSquare, Brain, Sun, Moon, LogOut, AlertTriangle, Check, Clock } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { PageWrapper } from "../components/shared/PageWrapper";
import { Badge } from "../components/shared/Badge";
import { GradientButton } from "../components/shared/GradientButton";
import { SkeletonCard } from "../components/shared/SkeletonCard";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { supabase } from "../lib/supabaseClient";
import {
  getEmployeeProfile,
  getLeaveRequests,
  createLeaveRequest,
  getAttendanceLogs,
  checkIn,
  checkOut,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  LeaveRequest,
  Attendance,
  EmployeeProfile
} from "../lib/queries";

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const { isDark, toggleDark, user } = useAppContext();
  const [activeTab, setActiveTab] = useState("overview");

  // State managers
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);

  // Leave Form state
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [formType, setFormType] = useState<"Annual Leave" | "Sick Leave" | "Personal Days">("Annual Leave");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Attendance checking state
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const tabs = ["overview", "leave", "payroll", "performance", "team"];

  const payslips = [
    { month: "June 2025", amount: "$8,500", status: "Paid", date: "Jun 30" },
    { month: "May 2025", amount: "$8,500", status: "Paid", date: "May 31" },
    { month: "April 2025", amount: "$8,200", status: "Paid", date: "Apr 30" },
  ];

  const performanceGoals = [
    { goal: "Complete Q2 product roadmap", progress: 80, due: "Jun 30" },
    { goal: "Lead onboarding for 3 new engineers", progress: 66, due: "Jul 15" },
    { goal: "Achieve 95%+ sprint velocity", progress: 91, due: "Ongoing" },
  ];

  const loadNotifications = async (companyId: number) => {
    if (!user) return;
    try {
      const notifList = await getNotifications(companyId, "employee", user.id);
      setNotifications(notifList);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  // Fetch all employee info on mount
  const loadDashboardData = async () => {
    if (!user) return;
    setPageLoading(true);
    setPageError("");
    try {
      // 1. Get employee database record matching user_id
      const empProfile = await getEmployeeProfile(user.id);
      if (!empProfile) {
        setPageError("No employee profile found in the database. Please contact your administrator.");
        setPageLoading(false);
        return;
      }
      setProfile(empProfile);

      // 2. Fetch leave requests and attendance logs parallelly
      const [leaves, logs] = await Promise.all([
        getLeaveRequests(empProfile.id),
        getAttendanceLogs(empProfile.id),
      ]);

      setLeaveList(leaves);
      setAttendanceList(logs);
      if (empProfile.company_id) {
        await loadNotifications(empProfile.company_id);
      }
    } catch (err: any) {
      console.error("Error loading employee dashboard data:", err);
      setPageError(err?.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Subscribe to notifications realtime updates
    const notifChannel = supabase
      .channel("notifications-employee-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        async () => {
          const empProfile = await getEmployeeProfile(user.id);
          if (empProfile?.company_id) {
            await loadNotifications(empProfile.company_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [user]);

  // Calculate leave balances based on approved requests
  const getDurationDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateLeaveBalances = () => {
    const usedDays = {
      "Annual Leave": 0,
      "Sick Leave": 0,
      "Personal Days": 0
    };

    leaveList.forEach(req => {
      if (req.status === "approved" && usedDays[req.type] !== undefined) {
        usedDays[req.type] += getDurationDays(req.start_date, req.end_date);
      }
    });

    return [
      { type: "Annual Leave", used: usedDays["Annual Leave"], total: 21, color: "#7c3aed" },
      { type: "Sick Leave", used: usedDays["Sick Leave"], total: 10, color: "#22d3ee" },
      { type: "Personal Days", used: usedDays["Personal Days"], total: 5, color: "#10b981" },
    ];
  };

  const leaveBalance = calculateLeaveBalances();

  // Find remaining annual leave days for overview
  const annualLeaveUsed = leaveBalance.find(b => b.type === "Annual Leave")?.used || 0;
  const annualLeaveRemaining = 21 - annualLeaveUsed;

  // Handle Attendance Check In / Out
  const today = new Date().toISOString().split("T")[0];
  const todayLog = attendanceList.find(log => log.date === today);
  const isCheckedIn = !!todayLog;
  const isCheckedOut = todayLog && !!todayLog.check_out;

  const handleAttendanceAction = async () => {
    if (!profile) return;
    setAttendanceLoading(true);
    try {
      if (!isCheckedIn) {
        // Perform Check-in
        const newLog = await checkIn(profile.id);
        setAttendanceList(prev => [newLog, ...prev]);
      } else if (!isCheckedOut) {
        // Perform Check-out
        const updatedLog = await checkOut(profile.id);
        setAttendanceList(prev => prev.map(log => log.date === today ? updatedLog : log));
      }
    } catch (err: any) {
      alert("Attendance log failed: " + err.message);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Submit new leave request
  const handleLeaveRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    if (!profile) return;
    if (!formStart || !formEnd) {
      setActionError("Please enter both start and end dates.");
      return;
    }

    if (new Date(formStart) > new Date(formEnd)) {
      setActionError("Start date cannot be after end date.");
      return;
    }

    setActionLoading(true);

    try {
      const newRequest = await createLeaveRequest({
        employee_id: profile.id,
        type: formType,
        start_date: formStart,
        end_date: formEnd,
      });

      setLeaveList(prev => [newRequest, ...prev]);
      setActionSuccess("Leave request submitted successfully!");
      setFormStart("");
      setFormEnd("");
      
      // Delay form close
      setTimeout(() => {
        setShowLeaveForm(false);
        setActionSuccess("");
      }, 2000);

    } catch (err: any) {
      setActionError(err.message || "Failed to submit leave request.");
    } finally {
      setActionLoading(false);
    }
  };

  const dynamicStyles = {
    topBarBg: isDark ? "rgba(8,8,15,0.9)" : "rgba(247,247,252,0.9)",
    topBarBorder: isDark ? "border-white/[0.05]" : "border-black/[0.08]",
    cardBg: isDark ? "bg-white/[0.02]" : "bg-black/[0.02]",
    cardBorder: isDark ? "border-white/[0.07]" : "border-black/[0.07]",
    divider: isDark ? "bg-white/[0.05]" : "bg-black/[0.05]"
  };

  if (pageLoading) {
    return (
      <PageWrapper className="min-h-screen bg-background text-foreground transition-colors duration-200">
        <div className="flex items-center justify-between px-6 h-16 border-b transition-all" style={{ background: dynamicStyles.topBarBg, borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-3">
            <Brain size={15} className="text-violet-400" />
            <span className="font-display font-bold text-sm">WorkSphere AI</span>
          </div>
          <Badge color="cyan">Loading Portal...</Badge>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (pageError) {
    return (
      <PageWrapper className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="text-red-400" size={24} />
          </div>
          <h2 className="text-xl font-display font-bold">Failed to Load Dashboard</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{pageError}</p>
          <GradientButton onClick={() => navigate("/")} size="md">
            Return to Landing
          </GradientButton>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 h-16 border-b sticky top-0 z-30 backdrop-blur-2xl transition-all"
        style={{
          background: dynamicStyles.topBarBg,
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            <Brain size={15} className="text-white" />
          </div>
          <span className="font-display font-bold text-sm text-foreground">WorkSphere AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="cyan">Employee Portal</Badge>
          <motion.button whileHover={{ scale: 1.05 }} onClick={toggleDark} className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </motion.button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/"); }} className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors cursor-pointer">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center gap-6 mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold font-display" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            {profile?.full_name?.split(" ").map(n => n[0]).join("") || "JW"}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{profile?.full_name || "James Wu"}</h1>
            <p className="text-sm text-muted-foreground font-display">{profile?.department || "Engineering"} · Staff Member</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge color="green">Active</Badge>
              <Badge color="violet">Level L3</Badge>
              <Badge color="cyan">Remote</Badge>
            </div>
          </div>

          {/* Quick Attendance Check-in Button */}
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-[10px] text-muted-foreground font-mono-data">Attendance Log</p>
              <p className="text-xs font-semibold text-foreground">
                {isCheckedOut ? "Checked out for today" : isCheckedIn ? "Active (Checked in)" : "Not Checked in"}
              </p>
            </div>
            <GradientButton
              onClick={handleAttendanceAction}
              disabled={attendanceLoading || isCheckedOut}
              size="sm"
              variant={isCheckedIn ? "secondary" : "primary"}
            >
              {attendanceLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : isCheckedOut ? (
                <>Checked Out</>
              ) : isCheckedIn ? (
                <><Clock size={12} /> Check Out</>
              ) : (
                <><Clock size={12} /> Check In</>
              )}
            </GradientButton>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className={`flex gap-1 rounded-xl border p-1 mb-8 overflow-x-auto ${dynamicStyles.cardBg}`} style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 px-4 text-xs font-semibold capitalize transition-all duration-200 whitespace-nowrap cursor-pointer ${
                activeTab === tab ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              style={activeTab === tab ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)" } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  { icon: Calendar, label: "Days Leave Remaining", value: `${annualLeaveRemaining} days`, sub: "of 21 annual", color: "#7c3aed" },
                  { icon: DollarSign, label: "Next Payslip", value: "Jul 31", sub: "Est. $8,500 net", color: "#10b981" },
                  { icon: Target, label: "Performance Score", value: "4.3/5.0", sub: "Q2 Rating · Excellent", color: "#22d3ee" },
                ].map(({ icon: Icon, label, value, sub, color }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }} className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20` }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-2xl font-display font-bold text-foreground mb-1">{value}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </motion.div>
                ))}
              </div>
              {/* Notifications */}
              <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-semibold text-foreground">Recent Notifications</p>
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <button
                      onClick={async () => {
                        if (profile?.company_id) {
                          await markAllNotificationsAsRead(profile.company_id, "employee", user.id);
                          await loadNotifications(profile.company_id);
                        }
                      }}
                      className="text-xs text-violet-400 hover:text-violet-300 font-semibold cursor-pointer bg-transparent border-none"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={async () => {
                        if (!n.is_read) {
                          await markNotificationAsRead(n.id);
                          if (profile?.company_id) {
                            await loadNotifications(profile.company_id);
                          }
                        }
                      }}
                      className={`flex items-start gap-3 p-1.5 rounded-lg transition-colors cursor-pointer ${
                        n.is_read ? "opacity-60 hover:bg-white/[0.01]" : "bg-white/[0.01] hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        !n.is_read ? "bg-violet-400" : "bg-muted-foreground"
                      }`} />
                      <div className="flex-1">
                        <p className="text-xs text-foreground leading-relaxed">{n.text}</p>
                        <p className="text-[10px] text-muted-foreground font-mono-data mt-0.5">
                          {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-violet-400" />
                      <div>
                        <p className="text-xs text-foreground leading-relaxed">No new notifications. You're all caught up!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "leave" && (
            <motion.div key="leave" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
              {/* Balances */}
              <div className="space-y-4">
                {leaveBalance.map(({ type, used, total, color }, i) => (
                  <div key={i} className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-foreground">{type}</p>
                      <p className="text-xs text-muted-foreground font-mono-data">{used}/{total} days used</p>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((used / total) * 100, 100)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{Math.max(total - used, 0)} days remaining</p>
                  </div>
                ))}
              </div>

              {/* Request Toggle */}
              {!showLeaveForm ? (
                <GradientButton onClick={() => setShowLeaveForm(true)} size="md" className="w-full justify-center">
                  <Plus size={14} className="mr-2" /> Request Leave
                </GradientButton>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-6 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-foreground font-display">New Leave Request</h3>
                    <button onClick={() => setShowLeaveForm(false)} className="text-muted-foreground hover:text-foreground text-xs cursor-pointer bg-transparent border-none">Cancel</button>
                  </div>
                  
                  <form onSubmit={handleLeaveRequestSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Leave Type</label>
                      <select
                        value={formType}
                        onChange={e => setFormType(e.target.value as any)}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                        style={{ background: isDark ? "#0d0d1c" : "#ffffff" }}
                      >
                        <option value="Annual Leave">Annual Leave</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Personal Days">Personal Days</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Start Date</label>
                        <input
                          type="date"
                          value={formStart}
                          onChange={e => setFormStart(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                          style={{ background: isDark ? "#0d0d1c" : "#ffffff" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">End Date</label>
                        <input
                          type="date"
                          value={formEnd}
                          onChange={e => setFormEnd(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                          style={{ background: isDark ? "#0d0d1c" : "#ffffff" }}
                        />
                      </div>
                    </div>

                    <AnimatePresence mode="popLayout">
                      {actionError && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                          <AlertTriangle size={13} className="text-red-400" />
                          <span className="text-xs text-red-300">{actionError}</span>
                        </motion.div>
                      )}
                      {actionSuccess && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-xs text-emerald-300">{actionSuccess}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <GradientButton type="submit" size="md" className="w-full justify-center" disabled={actionLoading}>
                      {actionLoading ? "Submitting..." : "Submit Leave Request"}
                    </GradientButton>
                  </form>
                </motion.div>
              )}

              {/* History Table */}
              <div className={`rounded-2xl border p-5 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                <p className="text-sm font-semibold text-foreground mb-4">Leave Request History</p>
                <div className="space-y-3">
                  {leaveList.map((req, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{req.type}</p>
                        <p className="text-[10px] text-muted-foreground font-mono-data">{req.start_date} to {req.end_date}</p>
                      </div>
                      <Badge color={req.status === "approved" ? "green" : req.status === "rejected" ? "red" : "amber"}>
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                  {leaveList.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No leave requests found.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "payroll" && (
            <motion.div key="payroll" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="space-y-3">
                {payslips.map(({ month, amount, status, date }, i) => (
                  <div key={i} className={`rounded-2xl border p-5 flex items-center justify-between ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                        <DollarSign size={16} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{month}</p>
                        <p className="text-xs text-muted-foreground font-display">Paid {date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-display font-bold text-foreground">{amount}</p>
                      <Badge color="green">{status}</Badge>
                      <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium flex items-center gap-1 cursor-pointer bg-transparent border-none">
                        <FileText size={11} /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "performance" && (
            <motion.div key="performance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className={`rounded-2xl border p-6 mb-4 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Q2 2025 Review</p>
                    <p className="text-3xl font-display font-black text-foreground">4.3 <span className="text-xl text-muted-foreground font-normal">/ 5.0</span></p>
                    <Badge color="green" className="mt-2">Excellent</Badge>
                  </div>
                  <div style={{ width: 100, height: 100 }}>
                    <ResponsiveContainer>
                      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={[{ value: 86, fill: "#7c3aed" }]} startAngle={90} endAngle={-270}>
                        <RadialBar dataKey="value" cornerRadius={8} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground mb-4">Q3 Goals</p>
                <div className="space-y-4">
                  {performanceGoals.map(({ goal, progress, due }, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-foreground">{goal}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono-data">{due}</span>
                          <span className="text-xs font-bold text-foreground">{progress}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ background: progress >= 80 ? "#10b981" : progress >= 60 ? "#7c3aed" : "#f59e0b" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "team" && (
            <motion.div key="team" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: "Sarah Chen", role: "Engineering Manager", avatar: "SC", status: "online" },
                  { name: "Tom Brennan", role: "Senior Backend Engineer", avatar: "TB", status: "online" },
                  { name: "Mia Torres", role: "UX Lead", avatar: "MT", status: "offline" },
                  { name: "Luke Chen", role: "Full-stack Engineer", avatar: "LC", status: "online" },
                  { name: "Aria Patel", role: "Frontend Engineer", avatar: "AP", status: "away" },
                  { name: "Devon Clark", role: "Product Designer", avatar: "DC", status: "online" },
                ].map(({ name, role, avatar, status }, i) => (
                  <div key={i} className={`flex items-center gap-4 rounded-2xl border p-4 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white font-display" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                        {avatar}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${status === "online" ? "bg-emerald-400" : status === "away" ? "bg-amber-400" : "bg-muted-foreground"}`} style={{ borderColor: isDark ? "#08080f" : "#f7f7fc" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                    <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none">
                      <MessageSquare size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
