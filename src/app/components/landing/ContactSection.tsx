import React, { useState } from "react";
import { Mail, Phone, MapPin, Check, Send } from "lucide-react";
import { Badge } from "../shared/Badge";
import { GradientButton } from "../shared/GradientButton";

export function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section className="py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20">
          <div>
            <Badge color="cyan">Contact Sales</Badge>
            <h2 className="text-4xl font-display font-bold mt-4 mb-6">
              Ready to transform<br />
              <span className="gradient-text">your workforce?</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Talk to a WorkSphere AI specialist. We'll walk you through a custom demo tailored to your industry, team size, and strategic priorities.
            </p>
            <div className="space-y-4">
              {[
                { icon: Mail, text: "enterprise@worksphere.ai" },
                { icon: Phone, text: "+1 (888) 977-4273" },
                { icon: MapPin, text: "San Francisco · London · Singapore" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Icon size={16} className="text-violet-400" /> {text}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 backdrop-blur-xl">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">Message received</h3>
                <p className="text-muted-foreground text-sm">Our team will reach out within 2 business hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { label: "Full name", key: "name", type: "text", placeholder: "Sarah Chen" },
                  { label: "Work email", key: "email", type: "email", placeholder: "sarah@company.com" },
                  { label: "Company", key: "company", type: "text", placeholder: "Acme Corp" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                      required
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your team size and key challenges..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
                    required
                  />
                </div>
                <GradientButton type="submit" size="lg" className="w-full justify-center">
                  Send Message <Send size={14} className="ml-2" />
                </GradientButton>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
