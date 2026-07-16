import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Check } from "lucide-react";
import { Badge } from "../shared/Badge";
import { caps } from "../../lib/constants";

export function AICapabilitiesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  return (
    <section className="py-32 border-y border-white/[0.06]" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Badge color="indigo">AI Capabilities</Badge>
            <h2 className="text-4xl font-display font-bold mt-4 mb-6">
              Intelligence that works<br />
              <span className="gradient-text">before you ask</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              WorkSphere's AI layer is always on — monitoring patterns, flagging risks, and surfacing opportunities across your entire workforce, 24 hours a day.
            </p>
            <div className="space-y-3">
              {["Natural language query interface", "Predictive risk scoring with confidence intervals", "Automated policy enforcement & audit trails", "Continuous model retraining on your data"].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-violet-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <div className="grid grid-cols-2 gap-4">
            {caps.map(({ icon: Icon, label, value, sub, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-2xl font-display font-black mb-1 text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
                <p className="text-xs font-medium text-foreground mt-2">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
