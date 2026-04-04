"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  points: string[];
}

export default function KeyPointsList({ points }: Props) {
  if (!points || points.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">Key Takeaways</h4>
      <ul className="space-y-2.5">
        {points.map((point, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 text-sm leading-relaxed"
          >
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--accent-primary)" }} />
            <span>{point}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
