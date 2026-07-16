import React from "react";

export interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 ${className}`}>
      <div className="shimmer h-3 w-24 rounded-full bg-white/5 mb-3" />
      <div className="shimmer h-7 w-32 rounded-full bg-white/5 mb-2" />
      <div className="shimmer h-2 w-20 rounded-full bg-white/5" />
    </div>
  );
}
