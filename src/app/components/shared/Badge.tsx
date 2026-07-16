import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  color?: "violet" | "cyan" | "green" | "amber" | "red" | "indigo";
  className?: string;
}

export function Badge({ children, color = "violet", className = "" }: BadgeProps) {
  const colors = {
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/20",
    red: "bg-red-500/15 text-red-300 border-red-500/20",
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium font-mono-data ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}
