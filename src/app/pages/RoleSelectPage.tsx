import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Building, User, Check, ArrowRight, Brain } from "lucide-react";
import { useAppContext, Role } from "../context/AppContext";
import { PageWrapper } from "../components/shared/PageWrapper";
import { Badge } from "../components/shared/Badge";

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { setRole } = useAppContext();

  const handleSelect = (r: Role) => {
    setRole(r);
    navigate("/login");
  };

  return (
    <PageWrapper className="bg-background flex flex-col items-center justify-center min-h-screen px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full" style={{ top: "10%", left: "20%", width: 400, height: 400, background: "radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)" }} />
        <div className="absolute rounded-full" style={{ bottom: "10%", right: "15%", width: 360, height: 360, background: "radial-gradient(circle,rgba(34,211,238,0.08) 0%,transparent 70%)" }} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center mb-12"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">WorkSphere AI</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground">Choose your workspace</h1>
        <p className="text-muted-foreground">Select your role to access the right experience for you.</p>
      </motion.div>
      <div className="relative grid md:grid-cols-2 gap-6 w-full max-w-2xl">
        {[
          {
            role: "hr" as Role,
            icon: Building,
            title: "HR Administrator",
            desc: "Full workforce intelligence dashboard, recruitment pipeline, analytics, compliance, and team management.",
            features: ["AI Daily Briefings", "Recruitment Kanban", "Compliance Dashboard", "Advanced Analytics"],
            badge: "Full Access",
            badgeColor: "violet" as const,
          },
          {
            role: "employee" as Role,
            icon: User,
            title: "Employee",
            desc: "Your personal portal — leave requests, payslips, performance reviews, attendance, and team updates.",
            features: ["Leave Management", "Payslip Access", "Performance Reviews", "Team Directory"],
            badge: "Self Service",
            badgeColor: "cyan" as const,
          },
        ].map(({ role, icon: Icon, title, desc, features, badge, badgeColor }, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
            whileHover={{ y: -4, boxShadow: "0 0 40px rgba(124,58,237,0.2)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(role)}
            className="group text-left rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 hover:border-violet-500/30 transition-all duration-300 backdrop-blur-xl cursor-pointer"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.3))", border: "1px solid rgba(124,58,237,0.3)" }}>
                <Icon size={24} className="text-violet-300" />
              </div>
              <Badge color={badgeColor}>{badge}</Badge>
            </div>
            <h2 className="text-xl font-display font-bold mb-3 text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{desc}</p>
            <ul className="space-y-2 mb-6">
              {features.map((f, fi) => (
                <li key={fi} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check size={12} className="text-violet-400 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-400 group-hover:gap-3 transition-all duration-200">
              Continue as {title} <ArrowRight size={14} />
            </div>
          </motion.button>
        ))}
      </div>
    </PageWrapper>
  );
}
