import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Badge } from "../shared/Badge";
import { features } from "../../lib/constants";

export function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  return (
    <section className="py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <Badge color="violet">Platform Features</Badge>
            <h2 className="text-4xl lg:text-5xl font-display font-bold mt-4 mb-6">
              Everything your workforce needs,<br />
              <span className="gradient-text">intelligently unified</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Six core pillars, hundreds of capabilities, one coherent platform designed for how enterprise HR actually operates.
            </p>
          </motion.div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              whileHover={{ y: -4, boxShadow: `0 0 40px ${color}20` }}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 cursor-pointer transition-all duration-300 hover:border-white/[0.12]"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <h3 className="text-base font-display font-semibold mb-3 text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
