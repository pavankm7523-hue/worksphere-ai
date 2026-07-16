import React from "react";
import { motion } from "motion/react";

export interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
}

export function GradientButton({
  children,
  onClick,
  className = "",
  variant = "primary",
  size = "md",
  type = "button"
}: GradientButtonProps) {
  const sizes = { sm: "px-4 py-2 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-8 py-4 text-base" };
  const base = `relative overflow-hidden rounded-xl font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 ${sizes[size]} ${className}`;

  if (variant === "primary") {
    return (
      <motion.button
        type={type}
        whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`${base} text-white`}
        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
      >
        {children}
      </motion.button>
    );
  }
  if (variant === "secondary") {
    return (
      <motion.button
        type={type}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`${base} border border-white/10 bg-white/5 text-foreground hover:bg-white/10`}
      >
        {children}
      </motion.button>
    );
  }
  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`${base} text-foreground hover:bg-white/5`}
    >
      {children}
    </motion.button>
  );
}
