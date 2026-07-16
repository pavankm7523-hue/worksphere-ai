import React from "react";
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                <Brain size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg">WorkSphere AI</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              The AI Workforce Intelligence Platform trusted by Fortune 500 HR teams.
            </p>
          </div>
          {[
            { title: "Product", items: ["Features", "Pricing", "Security", "Changelog"] },
            { title: "Solutions", items: ["Enterprise HR", "Recruitment", "Compliance", "Analytics"] },
            { title: "Company", items: ["About", "Careers", "Blog", "Contact"] },
          ].map(({ title, items }) => (
            <div key={title}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{title}</p>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item}>
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.05] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2025 WorkSphere AI, Inc. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">SOC 2 · ISO 27001 · GDPR · CCPA</p>
        </div>
      </div>
    </footer>
  );
}
