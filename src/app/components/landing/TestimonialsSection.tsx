import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { Star } from "lucide-react";
import { Badge } from "../shared/Badge";
import { testimonials } from "../../lib/constants";

export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge color="green">Customer Stories</Badge>
          <h2 className="text-4xl font-display font-bold mt-4">
            Trusted by world-class<br />
            <span className="gradient-text">people teams</span>
          </h2>
        </div>
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-10 backdrop-blur-xl text-center"
            >
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-lg text-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
                &ldquo;{testimonials[active].text}&rdquo;
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-sm text-white"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                  {testimonials[active].avatar}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">{testimonials[active].name}</p>
                  <p className="text-sm text-muted-foreground">{testimonials[active].title}</p>
                  <p className="text-xs text-muted-foreground">{testimonials[active].employees}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-8 bg-violet-500" : "w-1.5 bg-white/20"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
