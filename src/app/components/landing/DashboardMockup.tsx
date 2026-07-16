import React from "react";
import { motion } from "motion/react";
import { Brain, Home, Users, BarChart3, Calendar, Settings } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { attendanceData } from "../../lib/constants";

export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
      className="relative rounded-2xl overflow-hidden border border-white/[0.1] shadow-[0_0_80px_rgba(124,58,237,0.2)]"
      style={{ background: "#0d0d1c" }}
    >
      <div className="flex" style={{ height: 360 }}>
        {/* Mini sidebar */}
        <div className="w-14 border-r border-white/5 flex flex-col items-center py-4 gap-3" style={{ background: "#09091a" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            <Brain size={14} className="text-white" />
          </div>
          {[Home, Users, BarChart3, Calendar, Settings].map((Icon, i) => (
            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? "bg-violet-600/20" : "hover:bg-white/5"}`}>
              <Icon size={13} className={i === 0 ? "text-violet-400" : "text-white/30"} />
            </div>
          ))}
        </div>
        {/* Main area */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-2 w-28 rounded-full bg-white/20 mb-1" />
              <div className="h-1.5 w-20 rounded-full bg-white/10" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-lg bg-violet-600/30 border border-violet-500/30" />
              <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/5" />
            </div>
          </div>
          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Employees", val: "2,847", trend: "+12%", up: true },
              { label: "Attendance", val: "94.2%", trend: "+2.1%", up: true },
              { label: "Attrition Risk", val: "8.3%", trend: "-1.4%", up: false },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="rounded-xl border border-white/[0.06] p-3"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-white/40 text-[9px] mb-1 font-mono-data">{card.label}</p>
                <p className="text-white text-sm font-bold font-display mb-1">{card.val}</p>
                <p className={`text-[9px] font-medium ${card.up ? "text-emerald-400" : "text-red-400"}`}>{card.trend}</p>
              </motion.div>
            ))}
          </div>
          {/* Chart */}
          <div className="rounded-xl border border-white/[0.05] p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-white/30 text-[9px] mb-2 font-mono-data">Attendance Trend — 6 Months</p>
            <div style={{ height: 90 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="present" stroke="#7c3aed" strokeWidth={1.5} fill="url(#heroGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      {/* AI assistant pill */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-3 -right-3 rounded-2xl border border-violet-500/30 px-4 py-2 flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
        style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.2))" }}
      >
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        <span className="text-[11px] text-violet-300 font-semibold">AI Active</span>
      </motion.div>
    </motion.div>
  );
}
