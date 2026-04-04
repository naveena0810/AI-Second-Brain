"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  suggestions: string[];
}

export default function SuggestionsPanel({ suggestions }: Props) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
        <Sparkles size={12} className="text-purple-500" />
        Learning Path Recommendations
      </h4>
      <div className="grid grid-cols-1 gap-3">
        {suggestions.map((suggestion, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 p-4 rounded-2xl border transition-all hover:translate-x-1"
            style={{ 
              background: "var(--bg-primary)", 
              borderColor: "var(--border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
            }}
          >
            <div className="mt-1 flex-shrink-0 p-1.5 rounded-lg" style={{ background: "rgba(124,144,130,0.1)", color: "var(--accent-primary)" }}>
              <ArrowRight size={14} />
            </div>
            <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {suggestion}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
