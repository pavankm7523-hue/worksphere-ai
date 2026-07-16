import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // react-router-dom is used for standard browser navigation
import { motion, AnimatePresence } from "motion/react";
import { Brain, Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { GradientButton } from "../shared/GradientButton";

export function LandingNav() {
  const navigate = useNavigate();
  const { isDark, toggleDark } = useAppContext();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b border-white/[0.06] backdrop-blur-2xl" : ""
      }`}
      style={{
        background: scrolled
          ? isDark
            ? "rgba(8,8,15,0.85)"
            : "rgba(247,247,252,0.85)"
          : "transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">
            WorkSphere <span className="gradient-text">AI</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Solutions", "About", "Contact"].map(item => (
            <button key={item} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {item}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleDark}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </motion.button>
          <button onClick={() => navigate("/login")} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            Log in
          </button>
          <GradientButton onClick={() => navigate("/role-select")} size="sm">
            Launch WorkSphere AI <ArrowRight size={12} className="ml-1" />
          </GradientButton>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/[0.06] backdrop-blur-2xl"
            style={{ background: isDark ? "rgba(8,8,15,0.95)" : "rgba(247,247,252,0.95)" }}
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {["Features", "Solutions", "About", "Contact"].map(item => (
                <button key={item} className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                  {item}
                </button>
              ))}
              <GradientButton onClick={() => { navigate("/role-select"); setMenuOpen(false); }} size="sm" className="w-full justify-center">
                Launch WorkSphere AI
              </GradientButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
