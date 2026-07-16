import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, Check, TrendingUp, Brain } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { GradientButton } from "../shared/GradientButton";
import { DashboardMockup } from "./DashboardMockup";

export function HeroSection() {
  const navigate = useNavigate();
  const { isDark } = useAppContext();
  const words = ["Transform", "HR", "Operations", "with", "Autonomous", "AI"];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full"
          style={{ top: "15%", left: "10%", width: 480, height: 480, background: "radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 20, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute rounded-full"
          style={{ top: "30%", right: "8%", width: 400, height: 400, background: "radial-gradient(circle,rgba(34,211,238,0.12) 0%,transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute rounded-full"
          style={{ bottom: "20%", left: "30%", width: 360, height: 360, background: "radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)" }}
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
          backgroundSize: "64px 64px"
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — Headline */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 mb-8"
          >
            <Sparkles size={12} className="text-violet-400" />
            <span className="text-xs font-semibold text-violet-300">AI-Powered Workforce Platform</span>
          </motion.div>

          <h1 className="text-5xl lg:text-7xl font-display font-black leading-[1.05] mb-6 tracking-tight">
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: "easeOut" }}
                className={`inline-block mr-[0.25em] ${(i === 4 || i === 5) ? (isDark ? "gradient-text" : "gradient-text-light") : "text-foreground"}`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg"
          >
            WorkSphere AI unifies your entire people operation into one intelligent platform — from predictive hiring to autonomous compliance — trusted by Fortune 500 HR teams in 60+ countries.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <GradientButton onClick={() => navigate("/role-select")} size="lg">
              Start Free Trial <ArrowRight size={16} className="ml-2" />
            </GradientButton>
            <GradientButton variant="secondary" size="lg" onClick={() => navigate("/briefing")}>
              Watch Demo
            </GradientButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex items-center gap-6 text-sm text-muted-foreground"
          >
            {["No credit card required", "14-day free trial", "SOC 2 Compliant"].map((txt, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <Check size={13} className="text-emerald-400" /> {txt}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right — Dashboard Mockup */}
        <div className="hidden lg:block relative">
          <DashboardMockup />
          {/* Floating stat badges */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-12 top-1/4 rounded-2xl border border-white/[0.08] p-4 shadow-2xl"
            style={{ background: "rgba(13,13,28,0.9)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time to Hire</p>
                <p className="text-lg font-bold font-display text-foreground">↓ 68%</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
            className="absolute -right-8 bottom-1/3 rounded-2xl border border-white/[0.08] p-4 shadow-2xl"
            style={{ background: "rgba(13,13,28,0.9)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Brain size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">AI Accuracy</p>
                <p className="text-lg font-bold font-display text-foreground">94.7%</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
