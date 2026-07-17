import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Eye, EyeOff, AlertTriangle, ChevronLeft, Shield, Building2, Users, User } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { PageWrapper } from "../components/shared/PageWrapper";
import { GradientButton } from "../components/shared/GradientButton";
import { supabase } from "../lib/supabaseClient";

// Role-specific UI config
const roleConfig = {
  hr: {
    label: "HR Administrator",
    icon: Building2,
    accent: "#7c3aed",
    signupHeading: "Register your company",
    signupSubtext: "Set up your organisation on WorkSphere AI.",
    loginHeading: "Welcome back, HR Admin",
    companyFieldLabel: "Company Name",
    companyFieldPlaceholder: "Acme Corp",
    companyFieldHint: "Creating a new company workspace.",
    namePlaceholder: "Sarah Chen",
  },
  manager: {
    label: "Manager",
    icon: Users,
    accent: "#4f46e5",
    signupHeading: "Join your workspace",
    signupSubtext: "Connect to your company on WorkSphere AI.",
    loginHeading: "Welcome back, Manager",
    companyFieldLabel: "Your Company Name",
    companyFieldPlaceholder: "Acme Corp",
    companyFieldHint: "Enter the exact company name registered by your HR admin.",
    namePlaceholder: "John Smith",
  },
  employee: {
    label: "Employee",
    icon: User,
    accent: "#0891b2",
    signupHeading: "Create your account",
    signupSubtext: "Join your company portal on WorkSphere AI.",
    loginHeading: "Welcome back",
    companyFieldLabel: "Your Company Name",
    companyFieldPlaceholder: "Acme Corp",
    companyFieldHint: "Enter the exact company name registered by your HR admin.",
    namePlaceholder: "Alex Johnson",
  },
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { role, setRole, setJwt, setCompanyId, setUserStatus } = useAppContext();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", name: "", companyName: "" });

  const resolvedRole = (role || "employee") as "hr" | "manager" | "employee";
  const cfg = roleConfig[resolvedRole];
  const RoleIcon = cfg.icon;

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!form.name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!form.companyName.trim()) {
        setError(`Please enter your ${resolvedRole === "hr" ? "company name" : "company name to join"}.`);
        return;
      }
    }
    if (!form.email.trim()) {
      setError("Please enter your work email.");
      return;
    }
    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.password) {
      setError("Please enter your password.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const targetRole = resolvedRole;

      if (mode === "login") {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          const { data: employeeData, error: dbError } = await supabase
            .from("employees")
            .select("role, company_id, status")
            .eq("user_id", data.user.id);

          if (dbError) {
            setError("Authentication succeeded, but failed to load profile data: " + dbError.message);
            setLoading(false);
            return;
          }

          if (employeeData && employeeData.length > 0) {
            const profile = employeeData[0];
            setRole(profile.role);
            setCompanyId(profile.company_id);
            setUserStatus(profile.status);

            if (profile.status === "denied") {
              setError("Your access request was denied. Contact your HR administrator.");
              setLoading(false);
              return;
            }

            if (profile.status === "pending") {
              navigate(profile.role === "employee" ? "/dashboard/employee" : "/dashboard/manager");
              return;
            }

            if (profile.role === "employee") {
              navigate("/dashboard/employee");
            } else if (profile.role === "manager") {
              navigate("/dashboard/manager");
            } else {
              navigate("/dashboard/hr");
            }
          } else {
            navigate("/role-select");
          }
        }
      } else {
        const { data: existingCompany, error: compError } = await supabase
          .from("companies")
          .select("id, name")
          .ilike("name", form.companyName.trim());

        if (compError) {
          setError("Failed to validate company name: " + compError.message);
          setLoading(false);
          return;
        }

        if (targetRole === "hr") {
          if (existingCompany && existingCompany.length > 0) {
            setError("This company is already registered. Contact your HR administrator for access.");
            setLoading(false);
            return;
          }
        } else {
          if (!existingCompany || existingCompany.length === 0) {
            setError("No company found with this name. Double-check the name with your HR administrator.");
            setLoading(false);
            return;
          }
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name.trim(),
              company_name: form.companyName.trim(),
              role: targetRole,
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        const newUser = authData?.user;
        if (newUser) {
          if (authData.session) {
            setJwt(authData.session.access_token);

            const { data: employeeData } = await supabase
              .from("employees")
              .select("role, company_id, status")
              .eq("user_id", newUser.id);

            const profile = employeeData && employeeData.length > 0 ? employeeData[0] : null;
            const userRole = profile?.role || targetRole;
            const compId = profile?.company_id || null;
            const status = profile?.status || (targetRole === "hr" ? "active" : "pending");

            setRole(userRole);
            setCompanyId(compId);
            setUserStatus(status);

            if (userRole === "hr") {
              navigate("/dashboard/hr");
            } else if (userRole === "employee") {
              navigate("/dashboard/employee");
            } else {
              navigate("/dashboard/manager");
            }
          } else {
            setError("Sign up successful! Please check your email inbox to confirm your account before logging in.");
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const heading = mode === "login" ? cfg.loginHeading : cfg.signupHeading;

  return (
    <PageWrapper className="flex min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full" style={{ top: "5%", right: "10%", width: 500, height: 500, background: `radial-gradient(circle,${cfg.accent}1a 0%,transparent 70%)` }} />
        <div className="absolute rounded-full" style={{ bottom: "5%", left: "5%", width: 400, height: 400, background: "radial-gradient(circle,rgba(34,211,238,0.07) 0%,transparent 70%)" }} />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 border-r border-white/[0.06] relative">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">WorkSphere AI</span>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-8">
          <motion.div
            key={resolvedRole}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border p-6"
            style={{ background: `${cfg.accent}12`, borderColor: `${cfg.accent}30` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${cfg.accent}25` }}>
                <RoleIcon size={18} style={{ color: cfg.accent }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono-data">
                  {mode === "login" ? "Signing in as" : "Registering as"}
                </p>
                <p className="text-base font-display font-bold text-foreground">{cfg.label}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {resolvedRole === "hr" && "Access your full workforce intelligence suite — analytics, recruitment, compliance and team management."}
              {resolvedRole === "manager" && "Manage your assigned team — approve leave, track performance, and run evaluations."}
              {resolvedRole === "employee" && "Your personal portal — leave requests, payslips, reviews, and attendance tracking."}
            </p>
          </motion.div>

          <blockquote className="text-xl font-display font-medium leading-relaxed text-foreground">
            &ldquo;WorkSphere cut our time-to-hire from 34 days to 11 — and we retained 19 at-risk employees last quarter.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>PS</div>
            <div>
              <p className="text-sm font-semibold text-foreground">Priya Sharma</p>
              <p className="text-xs text-muted-foreground">CHRO, TechNova Global — 12,400 employees</p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {["SOC 2 Certified", "ISO 27001", "GDPR Ready"].map(badge => (
            <div key={badge} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield size={12} className="text-violet-400" /> {badge}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          <AnimatePresence mode="wait">
            <motion.div
              key={`${resolvedRole}-${mode}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="mb-8"
            >
              {/* Role pill */}
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4 text-xs font-semibold"
                style={{ background: `${cfg.accent}20`, color: cfg.accent, border: `1px solid ${cfg.accent}35` }}
              >
                <RoleIcon size={11} />
                {cfg.label}
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground">{heading}</h1>
              {mode === "signup" && (
                <p className="text-sm text-muted-foreground mt-1">{cfg.signupSubtext}</p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Mode toggle */}
          <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 mb-8">
            {(["login", "signup"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  mode === m ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                style={mode === m ? { background: `linear-gradient(135deg,${cfg.accent},${cfg.accent}bb)` } : {}}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {mode === "signup" && (
                <motion.div
                  key="signup-extra"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      placeholder={cfg.namePlaceholder}
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    />
                  </div>

                  {/* Company field — role-specific label/hint */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      {cfg.companyFieldLabel}
                    </label>
                    <input
                      type="text"
                      placeholder={cfg.companyFieldPlaceholder}
                      value={form.companyName}
                      onChange={e => setForm({ ...form, companyName: e.target.value })}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground/70 flex items-start gap-1">
                      <span style={{ color: cfg.accent }} className="mt-0.5 flex-shrink-0">✦</span>
                      {cfg.companyFieldHint}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Work Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence mode="popLayout">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
                >
                  <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-300 leading-normal">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <GradientButton
              type="submit"
              size="lg"
              className="w-full justify-center mt-2"
              style={{ background: `linear-gradient(135deg,${cfg.accent},${cfg.accent}bb)` } as React.CSSProperties}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Authenticating...
                </span>
              ) : (
                mode === "login"
                  ? `Sign In as ${cfg.label}`
                  : resolvedRole === "hr" ? "Register Company" : `Join as ${cfg.label}`
              )}
            </GradientButton>
          </form>

          <button
            onClick={() => navigate("/role-select")}
            className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto cursor-pointer bg-transparent border-none"
          >
            <ChevronLeft size={12} /> Switch role / Back to role selection
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
