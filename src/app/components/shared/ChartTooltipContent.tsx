import React from "react";

export interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number; unit?: string }>;
  label?: string;
}

export function ChartTooltipContent({ active, payload, label }: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d0d1c]/95 backdrop-blur-xl px-3 py-2 shadow-2xl">
      {label && <p className="text-white/40 text-xs mb-1 font-mono-data">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}{entry.unit || ""}
        </p>
      ))}
    </div>
  );
}
