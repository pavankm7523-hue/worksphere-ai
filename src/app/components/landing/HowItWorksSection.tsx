import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Badge } from "../shared/Badge";

export function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  const steps = [
    { num: "01", title: "Connect & Ingest", desc: "Link your existing HRIS, ATS, payroll, and communication tools. WorkSphere syncs all workforce data in under 24 hours, with zero manual data entry." },
    { num: "02", title: "AI Learns & Models", desc: "Our models analyze your historical patterns, industry benchmarks, and real-time signals to build a continuous intelligence layer unique to your organization." },
    { num: "03", title: "Act with Confidence", desc: "Receive daily AI briefings, predictive alerts, and automated workflows. Every recommendation is explainable, auditable, and actionable with one click." },
  ];

  return (
    <section className="py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 100%,rgba(124,58,237,0.08) 0%,transparent 70%)" }} />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <Badge color="cyan">How It Works</Badge>
          <h2 className="text-4xl lg:text-5xl font-display font-bold mt-4 mb-6">
            From setup to insight<br />
            <span className="gradient-text">in 72 hours</span>
          </h2>
        </div>
        <div className="relative">
          <div className="hidden lg:block absolute top-12 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map(({ num, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.15 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center relative"
                  style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                  <span className="text-3xl font-display font-black gradient-text">{num}</span>
                </div>
                <h3 className="text-xl font-display font-semibold mb-3 text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
