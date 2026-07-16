import React from "react";

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassCard({ children, className = "", style }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
