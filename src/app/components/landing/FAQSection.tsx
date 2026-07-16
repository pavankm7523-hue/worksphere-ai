import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { ChevronDown } from "lucide-react";
import { Badge } from "../shared/Badge";
import { faqs } from "../../lib/constants";

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  return (
    <section className="py-32 border-t border-white/[0.06]" ref={ref}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge color="amber">FAQ</Badge>
          <h2 className="text-4xl font-display font-bold mt-4">
            Common <span className="gradient-text">questions</span>
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-2xl border border-white/[0.07] overflow-hidden"
            >
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-foreground text-sm">{q}</span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-muted-foreground flex-shrink-0"
                >
                  <ChevronDown size={16} />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-white/[0.05] pt-4">
                      {a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
