import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, DollarSign, AlertTriangle, Target, Users, ChevronLeft, Brain, Sun, Moon, ArrowRight, Send } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { PageWrapper } from "../components/shared/PageWrapper";
import { GradientButton } from "../components/shared/GradientButton";
import { Badge } from "../components/shared/Badge";
import { briefCards } from "../lib/constants";

export default function BriefingPage() {
  const navigate = useNavigate();
  const { isDark, toggleDark } = useAppContext();
  const [query, setQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const prompts = [
    "Summarize today's attrition risks",
    "Which departments are understaffed?",
    "Show me pending approvals",
    "Forecast next quarter's hiring needs",
  ];

  const simulateResponse = (q: string) => {
    setIsTyping(true);
    setAiResponse("");
    const responses: Record<string, string> = {
      "Summarize today's attrition risks": "3 high-risk employees flagged in Engineering (2) and Sales (1). Primary factors: 18+ months without promotion, below-market compensation detected via benchmarking. Recommended actions: schedule 1:1 with managers within 48h.",
      "Which departments are understaffed?": "Engineering is at 87% of target headcount (−8 FTEs). Product Design is at 79% (−3 FTEs). Two open requisitions are 60+ days stale — recommend pipeline review.",
    };
    const text = responses[q] || `Analyzing "${q}" across your workforce data... Based on current signals, I recommend reviewing the relevant dashboard section for detailed insights.`;
    let i = 0;
    const t = setInterval(() => {
      setAiResponse(text.slice(0, i));
      i += 3;
      if (i > text.length) {
        setIsTyping(false);
        clearInterval(t);
        setAiResponse(text);
      }
    }, 20);
  };

  const getDynamicStyles = () => {
    return {
      topBarBg: isDark ? "rgba(8,8,15,0.85)" : "rgba(247,247,252,0.85)",
      topBarBorder: isDark ? "border-white/[0.06]" : "border-black/[0.06]",
      cardBg: isDark ? "bg-white/[0.03]" : "bg-black/[0.02]",
      cardBorder: isDark ? "border-white/[0.07]" : "border-black/[0.05]",
      btnBorder: isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.08] bg-black/[0.02]",
      inputBorder: isDark ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.5)",
      inputBg: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
    };
  };

  const styles = getDynamicStyles();

  return (
    <PageWrapper className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Top bar */}
      <div 
        className={`sticky top-0 z-40 flex items-center justify-between px-8 h-16 border-b backdrop-blur-2xl transition-all`} 
        style={{ background: styles.topBarBg, borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard/hr")} className={`w-8 h-8 rounded-lg flex items-center justify-center border text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${styles.btnBorder}`}>
            <ChevronLeft size={14} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              <Brain size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold font-display text-foreground">WorkSphere AI</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="violet">AI Briefing</Badge>
          <motion.button whileHover={{ scale: 1.05 }} onClick={toggleDark} className={`w-8 h-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${styles.btnBorder}`}>
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </motion.button>
          <button onClick={() => navigate("/dashboard/hr")} className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none">
            Full Dashboard <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
          <p className="text-sm text-muted-foreground mb-2 font-mono-data">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            {greeting}, <span className="gradient-text">Sarah</span> 👋
          </h1>
          <p className="text-muted-foreground">Here's your AI-curated workforce summary for today.</p>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {briefCards.map(({ icon: Icon, label, value, sub, color, trend }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -3 }}
              className={`rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${styles.cardBg} ${styles.cardBorder} hover:border-violet-500/30`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}25` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="text-xs text-muted-foreground font-mono-data">{label}</span>
              </div>
              <p className="text-2xl font-display font-bold text-foreground mb-1">{value}</p>
              <p className="text-xs text-muted-foreground mb-2">{sub}</p>
              <div className="h-px bg-white/[0.05] mb-2" />
              <p className="text-xs text-muted-foreground">{trend}</p>
            </motion.div>
          ))}
        </div>

        {/* AI Command Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-3xl border p-6 mb-6"
          style={{ borderColor: "rgba(124,58,237,0.25)", background: "rgba(124,58,237,0.05)", backdropFilter: "blur(24px)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              <Brain size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground font-display">AI Assistant</p>
              <p className="text-xs text-muted-foreground">Ask anything about your workforce</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-violet-400"
              />
              <span className="text-xs text-violet-400 font-medium font-mono-data">Active</span>
            </div>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Ask WorkSphere AI anything about your team..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && query.trim()) simulateResponse(query); }}
              className="w-full rounded-2xl border px-5 py-4 pr-14 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all"
              style={{ borderColor: styles.inputBorder, background: styles.inputBg, boxShadow: "0 0 0 3px rgba(124,58,237,0.1)" }}
            />
            <button
              onClick={() => { if (query.trim()) simulateResponse(query); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:shadow-[0_0_15px_rgba(124,58,237,0.5)] cursor-pointer"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              <Send size={14} />
            </button>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {prompts.map((p, i) => (
              <button
                key={i}
                onClick={() => { setQuery(p); simulateResponse(p); }}
                className={`rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-violet-500/30 hover:bg-violet-500/10 transition-all duration-200 cursor-pointer ${styles.cardBg} ${styles.cardBorder}`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* AI response */}
          <AnimatePresence>
            {(aiResponse || isTyping) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`rounded-xl border p-4 ${styles.cardBg} ${styles.cardBorder}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={12} className="text-violet-400" />
                  <span className="text-xs text-violet-400 font-semibold font-display">WorkSphere AI</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {aiResponse}
                  {isTyping && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="ml-0.5 inline-block w-0.5 h-4 bg-violet-400 align-middle" />}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex justify-center">
          <GradientButton onClick={() => navigate("/dashboard/hr")} size="lg">
            Open Full Dashboard <ArrowRight size={14} className="ml-2" />
          </GradientButton>
        </div>
      </div>
    </PageWrapper>
  );
}
