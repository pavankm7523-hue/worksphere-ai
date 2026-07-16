import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Building, TrendingUp, Database, Shield } from "lucide-react";
import { Counter } from "../shared/Counter";

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -100px 0px" });

  const stats = [
    { value: 2400, suffix: "+", label: "Enterprise Customers", icon: Building },
    { value: 68, suffix: "%", label: "Faster Time to Hire", icon: TrendingUp },
    { value: 4, suffix: "B+", label: "Data Points Analyzed", icon: Database },
    { value: 99, suffix: ".9%", label: "Platform Uptime SLA", icon: Shield },
  ];

  return (
    <section ref={ref} className="py-24 border-y border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(({ value, suffix, label, icon: Icon }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Icon size={18} className="text-violet-400" />
                </div>
              </div>
              <div className="text-4xl lg:text-5xl font-display font-black mb-2">
                {inView ? <Counter end={value} suffix={suffix} /> : `0${suffix}`}
              </div>
              <p className="text-sm text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
